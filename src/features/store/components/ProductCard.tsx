'use client';

import Link from 'next/link';
import { PriceTag } from './PriceTag';
import { STORE_BRAND } from '../config';
import type { StoreProductSummary } from '../types';

/**
 * Catalog card. Used on the store landing page and homepage feature
 * section. All styling via theme tokens — no Tailwind colors.
 */
export function ProductCard({ product }: { product: StoreProductSummary }) {
  return (
    <Link
      href={`${STORE_BRAND.routeBase}/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl transition-all hover:-translate-y-1"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-sm)',
        minHeight: 360,
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ background: 'var(--surface-2)', aspectRatio: '16/9' }}
      >
        {product.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.coverImageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, var(--accent-soft), transparent 60%)',
              color: 'var(--accent)',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.2em',
            }}
          >
            {STORE_BRAND.name.toUpperCase()}
          </div>
        )}
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.22em]"
          style={{
            background: 'var(--bg)',
            color: 'var(--accent)',
            border: '1px solid var(--rule)',
            fontFamily: 'var(--mono)',
            fontWeight: 600,
          }}
        >
          {product.category.replace(/-/g, ' ')}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3
          className="m-0 line-clamp-2 text-[17px] leading-[1.3]"
          style={{
            color: 'var(--ink)',
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            letterSpacing: '-0.015em',
            minHeight: 44,
          }}
        >
          {product.title}
        </h3>
        <p
          className="m-0 mt-3 line-clamp-2 text-[13.5px] leading-[1.6]"
          style={{ color: 'var(--ink-2)', minHeight: 44 }}
        >
          {product.shortDescription}
        </p>
        <div
          className="mt-auto flex items-end justify-between pt-5"
          style={{ borderTop: '1px solid var(--rule)' }}
        >
          <PriceTag
            priceUsdMinor={product.priceUsdMinor}
            priceInrMinor={product.priceInrMinor}
            size="md"
          />
          {product.salesCount > 0 && (
            <span
              className="text-[11px]"
              style={{
                color: 'var(--ink-soft)',
                fontFamily: 'var(--mono)',
                letterSpacing: '0.08em',
              }}
            >
              {product.salesCount} sold
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
