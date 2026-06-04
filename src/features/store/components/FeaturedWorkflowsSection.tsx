'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductGrid } from './ProductGrid';
import { STORE_BRAND } from '../config';
import type { StoreProductSummary } from '../types';

/**
 * Homepage spotlight for Keeda Labs. Lives lower on the page (between
 * AgentSection and CtaCard) so it doesn't compete with the main
 * Internet Keeda hero. Fetches client-side from /api/store/products
 * so it lazy-loads with the rest of the below-fold content.
 *
 * Renders nothing when the store has no published products yet —
 * means landing pages stay clean during pre-launch / restocks.
 */
export function FeaturedWorkflowsSection() {
  const [products, setProducts] = useState<StoreProductSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/store/products?featured=1&limit=3')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProducts(data?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loaded && products.length === 0) return null;

  return (
    <section
      style={{ padding: '80px 28px', background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              § {STORE_BRAND.name.toLowerCase()} · ai automation workflows
            </div>
            <h2
              className="m-0 mt-3"
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 'clamp(28px, 3.6vw, 42px)',
                fontWeight: 500,
                letterSpacing: '-0.025em',
                lineHeight: 1.05,
                color: 'var(--ink)',
                maxWidth: 720,
              }}
            >
              Hand-built{' '}
              <em
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                workflows
              </em>
              , ready to deploy.
            </h2>
            <p
              className="m-0 mt-4 max-w-[560px] text-[14.5px]"
              style={{ color: 'var(--ink-2)' }}
            >
              {STORE_BRAND.blurb}
            </p>
          </div>
          <Link
            href={STORE_BRAND.routeBase}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] font-semibold"
            style={{
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--rule)',
              fontFamily: 'var(--mono)',
            }}
          >
            Visit {STORE_BRAND.name}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-10">
          {!loaded ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-[360px] animate-pulse rounded-2xl"
                  style={{ background: 'var(--surface-2)' }}
                />
              ))}
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </section>
  );
}
