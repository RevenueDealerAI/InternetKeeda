'use client';

import { ProductCard } from './ProductCard';
import type { StoreProductSummary } from '../types';

export function ProductGrid({
  products,
  emptyLabel = 'No products yet. Check back soon.',
}: {
  products: StoreProductSummary[];
  emptyLabel?: string;
}) {
  if (!products.length) {
    return (
      <div
        className="grid place-items-center rounded-2xl p-12 text-center text-[14px]"
        style={{
          background: 'var(--bg-2)',
          border: '1px dashed var(--rule)',
          color: 'var(--ink-soft)',
          fontFamily: 'var(--mono)',
          letterSpacing: '0.08em',
        }}
      >
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 items-stretch sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
