'use client';

import { useEffect, useState } from 'react';
import { StoreHero } from './StoreHero';
import { ProductGrid } from './ProductGrid';
import { STORE_BRAND } from '../config';
import type { StoreProductSummary } from '../types';

export default function StoreLandingClient() {
  const [products, setProducts] = useState<StoreProductSummary[]>([]);
  const [featured, setFeatured] = useState<StoreProductSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [a, b] = await Promise.all([
          fetch('/api/store/products?featured=1&limit=3').then((r) => r.json()),
          fetch('/api/store/products?limit=24').then((r) => r.json()),
        ]);
        if (cancelled) return;
        setFeatured(a?.data || []);
        setProducts(b?.data || []);
      } catch (e) {
        console.warn('[store] load failed:', e);
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
      className="relative"
      style={{
        background: 'var(--bg)',
        color: 'var(--ink)',
        paddingTop: 120,
        paddingBottom: 80,
      }}
    >
      <div className="mx-auto max-w-[1320px] px-7">
        <StoreHero />

        {featured.length > 0 && (
          <section className="mt-20">
            <SectionHeading
              eyebrow="§ 01 — featured"
              title={
                <>
                  Most installed{' '}
                  <em
                    style={{
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontWeight: 400,
                    }}
                  >
                    workflows
                  </em>
                </>
              }
            />
            <div className="mt-8">
              <ProductGrid products={featured} />
            </div>
          </section>
        )}

        <section id="catalog" className="mt-20">
          <SectionHeading
            eyebrow="§ 02 — catalog"
            title={
              <>
                Every {STORE_BRAND.name}{' '}
                <em
                  style={{
                    fontFamily: 'var(--serif)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                  }}
                >
                  drop
                </em>
              </>
            }
          />
          <div className="mt-8">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-[380px] animate-pulse rounded-2xl"
                    style={{ background: 'var(--surface-2)' }}
                  />
                ))}
              </div>
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="text-[11px] uppercase tracking-[0.3em]"
        style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
      >
        {eyebrow}
      </div>
      <h2
        className="m-0 mt-3"
        style={{
          color: 'var(--ink)',
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(26px, 3.4vw, 38px)',
          fontWeight: 500,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
        }}
      >
        {title}
      </h2>
    </div>
  );
}
