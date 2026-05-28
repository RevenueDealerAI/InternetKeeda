'use client';

// "Eli" — the AI Keeda chat bot. Floating launcher at bottom-right of
// every public route. Click to open a small chat panel.
//
// - The "Try AI Keeda" CTA in <AgentSection /> dispatches a window
//   event `ik:open-eli` that this component listens for, so that
//   button opens the chat without per-component state plumbing.
// - Sends user messages to /api/tools/ai-search (the existing route).
//   Renders matched tools as inline tool cards using <ToolLogo>.
// - Persists open/closed state + conversation in localStorage so the
//   panel survives navs and reloads.
// - Hides itself on /admin routes (admin pages don't need a bot).

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { ToolLogo } from './ToolLogo';
import type { Tool } from '@/types/tool';

type Message =
  | { role: 'eli'; kind: 'text'; body: string }
  | { role: 'eli'; kind: 'tools'; body: string; tools: Tool[] }
  | { role: 'user'; kind: 'text'; body: string };

const BOT_NAME = 'Eli';
const BOT_TAG = 'AI Keeda · routing the index';
const GREET: Message = {
  role: 'eli',
  kind: 'text',
  body:
    "Hey, I'm Eli — AI Keeda's routing agent. Tell me what you're trying to build " +
    'and I\'ll pull the stack from 5,000+ tools. Try: "lip sync for podcasts" or ' +
    '"code companion that ships PRs".',
};

const LS_OPEN = 'ik-eli-open';
const LS_MSGS = 'ik-eli-msgs';

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

  // External openers ("Try AI Keeda" button in AgentSection dispatches
  // window 'ik:open-eli'; the existing mobile FAB dispatches
  // 'ik:open-search' which we also catch).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('ik:open-eli', onOpen);
    window.addEventListener('ik:open-search', onOpen);
    return () => {
      window.removeEventListener('ik:open-eli', onOpen);
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
      const summary =
        tools.length > 0
          ? `Routed across the index. Here's the stack I'd reach for:`
          : `I couldn't find a strong match for that. Try rephrasing what you want to ship?`;
      setMessages((m) => [...m, { role: 'eli', kind: 'tools', body: summary, tools }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'eli',
          kind: 'text',
          body: "Something went sideways on my end. Try again in a second?",
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
          aria-label="Open Eli — AI Keeda chat"
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
          <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
          Ask {BOT_NAME}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="AI Keeda chat with Eli"
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
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-full"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                  color: 'var(--on-accent)',
                  boxShadow: 'var(--shadow-accent)',
                  fontFamily: 'var(--sans)',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '-0.01em',
                }}
              >
                E
              </span>
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
              powered by ai keeda · {messages.length - 1} message{messages.length - 1 === 1 ? '' : 's'}
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
