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

/** Lightweight Keeda Labs product reference rendered as a card in
 *  the chat. Only PUBLISHED products are ever surfaced — the
 *  /api/tools/ai-search route enforces status:'published' before
 *  the model even sees the catalog. */
export type RileyStoreProduct = {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  category: string;
  priceUsdMinor: number;
  priceInrMinor: number;
  tags: string[];
};

type Message =
  | { role: 'bot'; kind: 'text'; body: string }
  | {
      role: 'bot';
      kind: 'tools';
      body: string;
      tools: Tool[];
      storeProducts?: RileyStoreProduct[];
      links?: NavLink[];
    }
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

function readOpen(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(LS_OPEN) === '1';
}
// Chat history is intentionally NOT persisted. A page refresh
// resets the conversation back to the greeting — matches the
// operator's expectation that the chat is a per-session helper,
// not a long-running record. Open/closed FAB state still
// persists via LS_OPEN so a user who reopens the panel mid-session
// doesn't lose context.

export function KeedaChat() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREET]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Hydrate open/closed state from localStorage after mount (avoid
  // SSR mismatch). Messages are NOT hydrated — each page load starts
  // with the greeting, so a refresh wipes the conversation.
  useEffect(() => {
    setMounted(true);
    setOpen(readOpen());
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

  // Messages are intentionally not persisted (see LS_OPEN comment
  // block above). On mount, also clear any legacy persisted
  // conversations from before this change so users with stale
  // localStorage get the same per-session-only behaviour.
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.removeItem('ik-chat-msgs');
    } catch {
      /* localStorage unavailable */
    }
  }, [mounted]);

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
      const storeProducts: RileyStoreProduct[] = Array.isArray(data?.storeProducts)
        ? (data.storeProducts as RileyStoreProduct[])
            .filter(
              (p) =>
                p &&
                typeof p.title === 'string' &&
                typeof p.slug === 'string' &&
                typeof p.priceUsdMinor === 'number'
            )
            .slice(0, 6)
        : [];
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
          : tools.length > 0 || storeProducts.length > 0
            ? "Here's what I'd reach for:"
            : links.length > 0
              ? 'Here are a few places that might help:'
              : "I couldn't find a strong match. Try rephrasing what you want to do?";
      setMessages((m) => [
        ...m,
        {
          role: 'bot',
          kind: 'tools',
          body: reply,
          tools,
          storeProducts: storeProducts.length > 0 ? storeProducts : undefined,
          links: links.length > 0 ? links : undefined,
        },
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
      {/* Launcher — fixed bottom-right, always present. Larger so it
          reads as a real persona handle, not a generic chat bubble. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${BOT_NAME} — Internet Keeda chat`}
          className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-3 rounded-full pl-2 pr-6 py-2 transition-transform hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: 'var(--on-accent)',
            boxShadow: 'var(--shadow-accent), 0 16px 40px -12px rgba(255,59,59,0.55)',
            fontFamily: 'var(--mono)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BOT_AVATAR}
            alt=""
            aria-hidden="true"
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-full"
            style={{ objectFit: 'cover', border: '2px solid rgba(255,255,255,0.85)' }}
          />
          <span className="flex flex-col items-start leading-tight">
            <span
              style={{
                fontSize: 9,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.78)',
                fontWeight: 500,
              }}
            >
              chat with
            </span>
            <span
              style={{
                fontSize: 16,
                letterSpacing: '0.04em',
                fontWeight: 700,
              }}
            >
              {BOT_NAME}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="ik-pulse-dot inline-block h-2 w-2 rounded-full"
            style={{ background: '#5ed7ff', boxShadow: '0 0 10px #5ed7ff' }}
          />
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
              {messages.length - 1} message{messages.length - 1 === 1 ? '' : 's'}
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
        {msg.storeProducts && msg.storeProducts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div
              className="px-1 text-[9px]"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--mono)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              § keeda labs · workflows you can buy
            </div>
            {msg.storeProducts.map((p) => (
              <Link
                key={p._id}
                href={`/store/${p.slug}`}
                className="flex items-center gap-2.5 rounded-xl p-2 transition-colors"
                style={{
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--rule)',
                }}
              >
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--accent)',
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    letterSpacing: '0.04em',
                  }}
                >
                  KL
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[12px] font-semibold"
                    style={{ color: 'var(--ink)' }}
                  >
                    {p.title}
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
                    {p.category.replace(/-/g, ' ')} · ${(p.priceUsdMinor / 100).toFixed(0)}
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
                  buy →
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
