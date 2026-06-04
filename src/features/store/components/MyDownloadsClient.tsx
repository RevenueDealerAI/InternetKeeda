'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, ShoppingBag } from 'lucide-react';
import { STORE_BRAND } from '../config';
import { formatPrice } from '../lib/pricing';
import type { StorePurchaseSummary } from '../types';

interface ApiPurchase extends StorePurchaseSummary {
  downloadUrl: string;
}

export default function MyDownloadsClient() {
  const [purchases, setPurchases] = useState<ApiPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/store/my-purchases');
        if (res.status === 401) {
          if (!cancelled) setUnauthenticated(true);
          return;
        }
        const data = await res.json();
        if (!cancelled) setPurchases(data?.data || []);
      } catch (e) {
        console.warn('[store/my-downloads]', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-[960px] px-7 pt-[140px] pb-24">
        <div
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
        >
          § {STORE_BRAND.name.toLowerCase()} · library
        </div>
        <h1
          className="m-0 mt-4"
          style={{
            color: 'var(--ink)',
            fontFamily: 'var(--sans)',
            fontSize: 'clamp(34px, 5vw, 52px)',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.04,
          }}
        >
          My downloads.
        </h1>
        <p
          className="mt-4 max-w-[520px] text-[15px] leading-[1.65]"
          style={{ color: 'var(--ink-2)' }}
        >
          Every workflow you've bought. Re-download anytime, on any device.
        </p>

        <div className="mt-12">
          {loading ? (
            <EmptyState label="Loading your library…" />
          ) : unauthenticated ? (
            <EmptyState
              label="Sign in to see what you've bought."
              cta={{ href: '/sign-in', label: 'Sign in' }}
            />
          ) : purchases.length === 0 ? (
            <EmptyState
              label="No downloads yet. Browse the catalog."
              cta={{ href: STORE_BRAND.routeBase, label: 'Browse workflows' }}
            />
          ) : (
            <ul className="m-0 flex flex-col gap-3 p-0">
              {purchases.map((p) => (
                <li
                  key={p._id}
                  className="flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:gap-5"
                  style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--rule)',
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`${STORE_BRAND.routeBase}/${p.productSlug}`}
                      className="block text-[16px] font-semibold"
                      style={{
                        color: 'var(--ink)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {p.productTitle}
                    </Link>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
                      style={{
                        color: 'var(--ink-soft)',
                        fontFamily: 'var(--mono)',
                      }}
                    >
                      <span>
                        Purchased {new Date(p.purchasedAt).toLocaleDateString()}
                      </span>
                      <span style={{ color: 'var(--ink-dim)' }}>·</span>
                      <span>
                        {formatPrice(p.amountPaidMinor, p.currency)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={p.downloadUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] font-semibold transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--on-accent)',
                      fontFamily: 'var(--mono)',
                      boxShadow: 'var(--shadow-accent)',
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function EmptyState({
  label,
  cta,
}: {
  label: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div
      className="rounded-2xl p-12 text-center"
      style={{
        background: 'var(--bg-2)',
        border: '1px dashed var(--rule)',
      }}
    >
      <div
        className="mx-auto grid h-12 w-12 place-items-center rounded-full"
        style={{
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
        }}
      >
        <ShoppingBag className="h-5 w-5" />
      </div>
      <p
        className="mx-auto mt-5 max-w-md text-[14px]"
        style={{ color: 'var(--ink-2)' }}
      >
        {label}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] font-semibold"
          style={{
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            fontFamily: 'var(--mono)',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          {cta.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
