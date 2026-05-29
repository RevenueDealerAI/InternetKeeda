'use client';

// Hover + click mega-menu for Nav links.
// - Trigger element renders inline in the Nav with a chevron caret.
// - Hovering / focusing / clicking the trigger reveals the panel
//   anchored beneath the trigger row. Pointer-leave delays close so
//   the user can move the cursor across the gap.
// - Each menu defines its own columns (link groups) + an optional
//   featured CTA panel on the right.
// - Esc closes; click outside closes.

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export type MenuColumn = {
  title: string;
  links: { label: string; href: string; description?: string }[];
};
export type MenuFeature = {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
};
export type MegaMenu = {
  label: string;
  /** Primary destination — clicking the label itself navigates here. */
  href: string;
  columns: MenuColumn[];
  feature?: MenuFeature;
};

export function NavMegaMenu({ menu }: { menu: MegaMenu }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLLIElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  const openNow = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };
  const scheduleClose = (delay = 140) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), delay);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <li
      ref={containerRef}
      className="list-none"
      onMouseEnter={openNow}
      onMouseLeave={() => scheduleClose()}
    >
      <Link
        href={menu.href}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onFocus={openNow}
        onClick={() => setOpen(false)}
        className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors"
        style={{ color: 'var(--ink-2)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
          (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = 'var(--ink-2)';
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        {menu.label}
        <ChevronDown
          className="h-3 w-3 opacity-70 transition-transform"
          strokeWidth={2.5}
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </Link>

      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label={`${menu.label} menu`}
          className="absolute left-0 right-0 top-full mx-auto mt-3 px-3"
          style={{ maxWidth: 1320 }}
          onMouseEnter={openNow}
          onMouseLeave={() => scheduleClose()}
        >
          <div
            className="overflow-hidden rounded-2xl backdrop-blur-2xl"
            style={{
              background: 'color-mix(in oklab, var(--bg-2) 96%, transparent)',
              border: '1px solid var(--rule)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              className="grid gap-0"
              style={{
                gridTemplateColumns: menu.feature
                  ? `repeat(${menu.columns.length}, minmax(0, 1fr)) 1.2fr`
                  : `repeat(${menu.columns.length}, minmax(0, 1fr))`,
              }}
            >
              {menu.columns.map((col, i) => (
                <div
                  key={col.title}
                  className="p-6"
                  style={{
                    borderRight:
                      i < menu.columns.length - 1 || menu.feature
                        ? '1px solid var(--rule)'
                        : 'none',
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.25em]"
                    style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
                  >
                    {col.title}
                  </div>
                  <ul className="m-0 mt-4 grid list-none gap-1 p-0">
                    {col.links.map((l) => (
                      <li key={l.href + l.label} className="list-none">
                        <Link
                          href={l.href}
                          role="menuitem"
                          onClick={() => setOpen(false)}
                          className="block rounded-lg px-3 py-2 transition-colors"
                          style={{ color: 'var(--ink)' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              'var(--accent-soft)';
                            (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
                          }}
                        >
                          <span className="text-[13px] font-semibold">{l.label}</span>
                          {l.description && (
                            <span
                              className="mt-0.5 block text-[11px] leading-[1.4]"
                              style={{ color: 'var(--ink-soft)' }}
                            >
                              {l.description}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {menu.feature && (
                <div
                  className="p-6"
                  style={{ background: 'var(--surface)' }}
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
                  >
                    {menu.feature.eyebrow}
                  </div>
                  <h3
                    className="m-0 mt-2 text-[20px] font-semibold leading-[1.15] tracking-tight"
                    style={{ color: 'var(--ink)' }}
                  >
                    {menu.feature.title}
                  </h3>
                  <p
                    className="m-0 mt-2 text-[13px] leading-[1.55]"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    {menu.feature.body}
                  </p>
                  <Link
                    href={menu.feature.cta.href}
                    onClick={() => setOpen(false)}
                    className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                      color: 'var(--on-accent)',
                      boxShadow: 'var(--shadow-accent)',
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {menu.feature.cta.label} →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
