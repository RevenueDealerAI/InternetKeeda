'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useCategories } from '@/hooks/useCategories';

// Static fallback so the strip renders before the API responds.
const FALLBACK: { name: string; icon: string }[] = [
  { name: 'Writing', icon: '✎' },
  { name: 'Design', icon: '◇' },
  { name: 'Code', icon: '⌘' },
  { name: 'Image', icon: '◐' },
  { name: 'Audio', icon: '♪' },
  { name: 'Video', icon: '▷' },
  { name: 'Research', icon: '?' },
  { name: 'Agents', icon: '△' },
  { name: 'Automation', icon: '⚙' },
  { name: 'Voice', icon: '◊' },
  { name: '3D', icon: '◈' },
  { name: 'Vision', icon: '◯' },
];

function iconFor(name: string): string {
  const found = FALLBACK.find((f) => f.name.toLowerCase() === name.toLowerCase());
  return found?.icon ?? '✦';
}

export function CategoryPills() {
  const { data } = useCategories(true, 80);

  // Top 12 by toolCount, fallback to a sensible static list.
  const items = useMemo(() => {
    const apiCats = (data?.data ?? [])
      .slice()
      .sort((a, b) => (b.toolCount ?? 0) - (a.toolCount ?? 0))
      .slice(0, 12);
    if (apiCats.length >= 6) {
      return apiCats.map((c) => ({
        name: c.name,
        slug: c.slug ?? c.name.toLowerCase().replace(/\s+/g, '-'),
        count: c.toolCount ?? 0,
        icon: iconFor(c.name),
      }));
    }
    return FALLBACK.map((f) => ({
      name: f.name,
      slug: f.name.toLowerCase().replace(/\s+/g, '-'),
      count: 0,
      icon: f.icon,
    }));
  }, [data?.data]);

  return (
    <div className="mt-12 w-full">
      <div className="font-mono-display mb-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        browse by category
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {items.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="ik-pill group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-transform hover:-translate-y-0.5"
          >
            <span aria-hidden="true" className="font-display text-base italic text-blood">
              {c.icon}
            </span>
            <span className="font-sans text-sm text-foreground group-hover:text-foreground">
              {c.name}
            </span>
            {c.count > 0 && (
              <span className="font-mono-display rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] tabular-nums text-foreground/70">
                {c.count.toLocaleString()}
              </span>
            )}
          </Link>
        ))}
        <Link
          href="/categories"
          className="font-mono-display group ml-1 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-blood transition-transform hover:-translate-y-0.5"
        >
          + all categories
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
