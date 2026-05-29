'use client';

// "Riley" — the Internet Keeda routing + concierge agent. Floating
// launcher at bottom-right of every public route. Click to open a
// small chat panel.
//
// - The "Try Riley" CTA in <AgentSection /> dispatches a window event
//   `ik:open-chat` that this component listens for. The event name is
//   intentionally name-agnostic so future rebrands stay UI-only.
// - Sends user messages to /api/tools/ai-search. That route runs Claude
//   server-side and returns { reply, tools, links }; we render the
//   reply text, matched tool cards via <ToolLogo>, and any navigation
//   links Maya surfaced for the user.
// - Persists open/closed state + conversation in localStorage so the
//   panel survives navs and reloads. Storage keys are also name-
//   agnostic (`ik-chat-*`).
// - Hides itself on /admin routes (admin pages don't need a bot).

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Send, Sparkles, X } from 'lucide-react';
import { ToolLogo } from './ToolLogo';
import type { Tool } from '@/types/tool';

type NavLink = { label: string; href: string };

type Message =
  | { role: 'bot'; kind: 'text'; body: string }
  | { role: 'bot'; kind: 'tools'; body: string; tools: Tool[]; links?: NavLink[] }
  | { role: 'user'; kind: 'text'; body: string };

const BOT_NAME = 'Riley';
const BOT_TAG = 'Internet Keeda · concierge';
// Riley's portrait — a photorealistic AI-generated face (StyleGAN2 via
// thispersondoesnotexist.com), saved locally so it loads instantly and
// stays consistent across reloads.
const BOT_AVATAR = '/branding/riley.jpg';
const GREET: Message = {
  role: 'bot',
  kind: 'text',
  body:
    "Hey, I'm Riley — your concierge for Internet Keeda. Ask me to find a tool, " +
    'compare options, walk you through pricing, or take you to a section. ' +
    'Try: "best image gen for posters" or "how do I list my tool?"',
};

const LS_OPEN = 'ik-chat-open';
const LS_MSGS = 'ik-chat-msgs';

function readOpen(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(LS_OPEN) === '1';
}
function readMessages(): Message[] {
  if (typeof localStorage === 'undefined') return [GREET];
  try {
    const raw = localStorage.getItem(LS_MSGS);
    if (!raw) return [GREET];
    const parsed = JSON.parse(raw) as Message[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [GREET];
  } catch {
    return [GREET];
  }
}

export function KeedaChat() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREET]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Hydrate from localStorage after mount (avoid SSR mismatch).
  useEffect(() => {
    setMounted(true);
    setOpen(readOpen());
    setMessages(readMessages());
  }, []);

  // Persist open/closed.
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_OPEN, open ? '1' : '0');
    } catch {
      /* localStorage unavailable */
    }
  }, [open, mounted]);

  // Persist messages.
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_MSGS, JSON.stringify(messages));
    } catch {
      /* localStorage unavailable */
    }
  }, [messages, mounted]);

  // Auto-scroll on new message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  // External openers — name-agnostic event names so future rebrands
  // don't need to touch this hook. AgentSection dispatches
  // 'ik:open-chat'; the existing mobile FAB dispatches 'ik:open-search'.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('ik:open-chat', onOpen);
    window.addEventListener('ik:open-search', onOpen);
    return () => {
      window.removeEventListener('ik:open-chat', onOpen);
      window.removeEventListener('ik:open-search', onOpen);
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', kind: 'text', body: text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok) throw new Error(`request failed (${res.status})`);
      const data = await res.json();
      const tools = Array.isArray(data?.tools) ? (data.tools as Tool[]).slice(0, 6) : [];
      const links: NavLink[] = Array.isArray(data?.links)
        ? (data.links as NavLink[])
            .filter(
              (l) =>
                l &&
                typeof l.label === 'string' &&
                typeof l.href === 'string' &&
                (l.href.startsWith('/') || l.href.startsWith('https://wa.me/')),
            )
            .slice(0, 4)
        : [];
      const reply =
        typeof data?.reply === 'string' && data.reply.trim().length > 0
          ? data.reply.trim()
          : tools.length > 0
            ? "Here's what I'd reach for:"
            : links.length > 0
              ? 'Here are a few places that might help:'
              : "I couldn't find a strong match. Try rephrasing what you want to do?";
      setMessages((m) => [
        ...m,
        { role: 'bot', kind: 'tools', body: reply, tools, links: links.length > 0 ? links : undefined },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'bot',
          kind: 'text',
          body: 'Something went sideways on my end. Try again in a second?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || isAdmin) return null;

  return (
    <>
      {/* Launcher — fixed bottom-right, always present */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${BOT_NAME} — Internet Keeda chat`}
          className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full px-4 py-3 transition-transform hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: 'var(--on-accent)',
            boxShadow: 'var(--shadow-accent)',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BOT_AVATAR}
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
            className="h-5 w-5 rounded-full"
            style={{ objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.7)' }}
          />
          Ask {BOT_NAME}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={`${BOT_NAME} chat — Internet Keeda concierge`}
          className="fixed bottom-5 right-5 z-[60] flex w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl backdrop-blur-2xl"
          style={{
            background: 'color-mix(in oklab, var(--bg-2) 94%, transparent)',
            border: '1px solid var(--rule)',
            boxShadow: 'var(--shadow)',
            maxHeight: 'min(560px, calc(100vh - 40px))',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-3 border-b px-4 py-3"
            style={{ borderColor: 'var(--rule)' }}
          >
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BOT_AVATAR}
                alt={`${BOT_NAME} avatar`}
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-full"
                style={{
                  objectFit: 'cover',
                  border: '2px solid var(--accent)',
                  boxShadow: 'var(--shadow-accent)',
                }}
              />
              <div className="leading-tight">
                <div
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--ink)' }}
                >
                  {BOT_NAME}
                </div>
                <div
                  className="text-[9px] uppercase tracking-[0.2em]"
                  style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
                >
                  {BOT_TAG}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid h-8 w-8 place-items-center rounded-full transition-colors"
              style={{
                background: 'var(--surface)',
                color: 'var(--ink-2)',
                border: '1px solid var(--rule)',
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ scrollbarColor: 'var(--rule) transparent' }}
          >
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <Bubble key={i} msg={m} />
              ))}
              {loading && (
                <div
                  className="self-start rounded-2xl px-3 py-2 text-[12px]"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--rule)',
                    fontFamily: 'var(--mono)',
                    letterSpacing: '0.05em',
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                    {BOT_NAME} is thinking…
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={onSubmit}
            className="border-t px-3 py-3"
            style={{ borderColor: 'var(--rule)' }}
          >
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--rule)' }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${BOT_NAME} — what are you trying to ship?`}
                aria-label={`Ask ${BOT_NAME}`}
                disabled={loading}
                className="flex-1 bg-transparent text-[13px] focus:outline-none"
                style={{ color: 'var(--ink)' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="grid h-8 w-8 place-items-center rounded-full transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                  color: 'var(--on-accent)',
                  boxShadow: 'var(--shadow-accent)',
                }}
              >
                <Send className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
            </div>
            <div
              className="mt-2 text-center text-[9px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
            >
              powered by claude · {messages.length - 1} message{messages.length - 1 === 1 ? '' : 's'}
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div
        className="self-end rounded-2xl px-3 py-2 text-[13px] leading-[1.5]"
        style={{
          maxWidth: '85%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          color: 'var(--on-accent)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {msg.body}
      </div>
    );
  }

  if (msg.kind === 'tools') {
    return (
      <div className="flex max-w-[92%] flex-col gap-2 self-start">
        <div
          className="rounded-2xl px-3 py-2 text-[13px] leading-[1.5]"
          style={{
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--rule)',
          }}
        >
          {msg.body}
        </div>
        {msg.tools.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {msg.tools.map((t) => (
              <Link
                key={t._id || t.slug}
                href={`/ai-tools/${t.slug}`}
                className="flex items-center gap-2.5 rounded-xl p-2 transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--rule)',
                }}
              >
                <ToolLogo tool={t} size={32} radius={8} />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[12px] font-semibold"
                    style={{ color: 'var(--ink)' }}
                  >
                    {t.name}
                  </div>
                  <div
                    className="truncate text-[10px]"
                    style={{
                      color: 'var(--ink-soft)',
                      fontFamily: 'var(--mono)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    /{(t.category || 'tool').toLowerCase()}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    color: 'var(--accent)',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                  }}
                >
                  open →
                </span>
              </Link>
            ))}
          </div>
        )}
        {msg.links && msg.links.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.links.map((l) => {
              const external = !l.href.startsWith('/');
              const isWhatsApp = l.href.startsWith('https://wa.me/');
              const className =
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-transform hover:-translate-y-0.5';
              const style: CSSProperties = isWhatsApp
                ? {
                    background: '#25D366',
                    color: '#fff',
                    border: '1px solid #25D366',
                    fontFamily: 'var(--mono)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }
                : {
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    border: '1px solid var(--rule)',
                    fontFamily: 'var(--mono)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  };

              if (external) {
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    style={style}
                  >
                    {l.label} <span aria-hidden="true">↗</span>
                  </a>
                );
              }
              return (
                <Link key={l.href} href={l.href} className={className} style={style}>
                  {l.label} <span aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="self-start rounded-2xl px-3 py-2 text-[13px] leading-[1.5]"
      style={{
        maxWidth: '85%',
        background: 'var(--surface)',
        color: 'var(--ink)',
        border: '1px solid var(--rule)',
      }}
    >
      {msg.body}
    </div>
  );
}
