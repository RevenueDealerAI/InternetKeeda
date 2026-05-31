'use client';

/**
 * Mobile navigation drawer. Renders the same Launches / Categories /
 * Products / News mega-menus the desktop nav shows — flattened into
 * a single accordion list, plus the Advertise plain link, plus a
 * footer block linking to the legal pages.
 *
 * Visible only on <lg viewports (the desktop nav handles lg+).
 * Uses the existing shadcn Sheet primitive — no new dep.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { MegaMenu } from './NavMegaMenu';
import { BRAND } from '@/lib/brand';

interface MobileNavProps {
  menus: MegaMenu[];
}

const LEGAL_LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Refund', href: '/refund' },
];

export function MobileNav({ menus }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          // 36×36 to match ThemeToggle + NavAccount siblings so the
          // right cluster reads as one visual row.
          className="grid h-9 w-9 place-items-center rounded-full transition-colors lg:hidden"
          style={{
            background: 'transparent',
            color: 'var(--ink)',
          }}
        >
          <Menu className="h-4 w-4" strokeWidth={2} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[300px] sm:w-[360px] overflow-y-auto p-0"
        style={{ background: 'var(--bg-2)', color: 'var(--ink)' }}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--rule)' }}>
          <SheetTitle
            className="text-left text-[10px] uppercase tracking-[0.25em]"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            Menu · {BRAND.name}
          </SheetTitle>
        </SheetHeader>

        <nav className="px-2 py-3" aria-label="Mobile">
          {menus.map((menu) => (
            <MobileSection key={menu.label} menu={menu} onNavigate={close} />
          ))}
          <Link
            href="/advertise"
            onClick={close}
            className="block rounded-md px-3 py-3 text-[15px] font-medium transition-colors"
            style={{ color: 'var(--ink)' }}
          >
            Advertise
          </Link>
          <Link
            href="/submit-tool"
            onClick={close}
            className="block rounded-md px-3 py-3 text-[15px] font-medium transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            + Submit your tool
          </Link>
        </nav>

        <div
          className="mt-2 border-t px-5 py-4"
          style={{ borderColor: 'var(--rule)' }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.25em] mb-3"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            Legal
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="text-[13px]"
                style={{ color: 'var(--ink-2)' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileSection({
  menu,
  onNavigate,
}: {
  menu: MegaMenu;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Flatten the desktop columns into a single list — mega-menu
  // columns are a desktop affordance; on phone they're noise.
  const allLinks = menu.columns.flatMap((col) => col.links);
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-md px-3 py-3 text-[15px] font-medium transition-colors"
        style={{ color: 'var(--ink)' }}
      >
        <span>{menu.label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>
      {expanded && (
        <div className="pl-3 pb-2">
          <Link
            href={menu.href}
            onClick={onNavigate}
            className="block rounded-md px-3 py-2 text-[13.5px]"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.04em',
            }}
          >
            All {menu.label.toLowerCase()} →
          </Link>
          {allLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              className="block rounded-md px-3 py-2 text-[14px]"
              style={{ color: 'var(--ink-2)' }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
