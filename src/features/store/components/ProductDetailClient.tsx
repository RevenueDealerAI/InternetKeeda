'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { CheckoutCard } from './CheckoutCard';
import { STORE_BRAND } from '../config';
import { formatFileSize } from '../lib/pricing';
import type { StoreProductDetail } from '../types';

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<StoreProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/store/products/${encodeURIComponent(slug)}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!cancelled) setProduct(data?.data || null);
      } catch (e) {
        console.warn('[store/detail] load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main
        className="min-h-screen"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        <div
          className="mx-auto max-w-[1080px] px-7 py-32 text-center text-[14px]"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
        >
          Loading…
        </div>
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main
        className="min-h-screen"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        <div className="mx-auto max-w-[680px] px-7 py-32 text-center">
          <h1
            className="m-0 mb-4"
            style={{
              color: 'var(--ink)',
              fontSize: 42,
              fontWeight: 600,
              letterSpacing: '-0.03em',
            }}
          >
            Not in the catalog.
          </h1>
          <p style={{ color: 'var(--ink-2)' }}>
            This workflow is either unpublished or no longer for sale.
          </p>
          <Link
            href={STORE_BRAND.routeBase}
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em]"
            style={{
              background: 'var(--surface)',
              color: 'var(--ink-2)',
              border: '1px solid var(--rule)',
              fontFamily: 'var(--mono)',
              fontWeight: 600,
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {STORE_BRAND.name}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1080px] px-7 pt-[140px] pb-24">
        <nav
          className="mb-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
        >
          <Link
            href={STORE_BRAND.routeBase}
            className="inline-flex items-center gap-1.5"
            style={{ color: 'var(--accent)' }}
          >
            <ArrowLeft className="h-3 w-3" />
            {STORE_BRAND.name}
          </Link>
          <span style={{ color: 'var(--ink-dim)' }}>/</span>
          <span style={{ textTransform: 'none', letterSpacing: 0 }}>
            {product.category.replace(/-/g, ' ')}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
          {/* Left: identity + description */}
          <div>
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--rule)',
                aspectRatio: '16/9',
              }}
            >
              {product.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.coverImageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
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
            </div>

            <h1
              className="m-0 mt-10"
              style={{
                color: 'var(--ink)',
                fontFamily: 'var(--sans)',
                fontSize: 'clamp(28px, 4vw, 46px)',
                fontWeight: 600,
                letterSpacing: '-0.028em',
                lineHeight: 1.1,
              }}
            >
              {product.title}
            </h1>
            {product.shortDescription && (
              <p
                className="m-0 mt-5 text-[16px] leading-[1.75]"
                style={{ color: 'var(--ink-2)' }}
              >
                {product.shortDescription}
              </p>
            )}

            <div
              className="mt-10 rounded-2xl p-7"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--rule)',
              }}
            >
              <div
                className="text-[11px] uppercase tracking-[0.3em]"
                style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
              >
                What it does
              </div>
              <div
                className="mt-4 whitespace-pre-line text-[15.5px] leading-[1.75]"
                style={{ color: 'var(--ink-2)' }}
              >
                {product.description}
              </div>
            </div>

            {product.includes?.length > 0 && (
              <div
                className="mt-6 rounded-2xl p-7"
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--rule)',
                }}
              >
                <div
                  className="text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
                >
                  What's included
                </div>
                <ul className="m-0 mt-5 flex flex-col gap-3 p-0">
                  {product.includes.map((line, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-[15px] leading-[1.6]"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      <span
                        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                        style={{
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)',
                        }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.previewImages?.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {product.previewImages.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt="Preview"
                    className="w-full rounded-xl"
                    style={{ border: '1px solid var(--rule)' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: buy panel */}
          <aside>
            <div className="sticky top-28">
              <CheckoutCard
                productId={product._id}
                priceUsdMinor={product.priceUsdMinor}
                priceInrMinor={product.priceInrMinor}
              />
              <dl
                className="mt-5 grid grid-cols-2 gap-3 rounded-xl px-5 py-4 text-[12px]"
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--rule)',
                  fontFamily: 'var(--mono)',
                }}
              >
                <Spec label="Category" value={product.category.replace(/-/g, ' ')} />
                <Spec label="File" value={product.fileName} />
                <Spec label="Size" value={formatFileSize(product.fileSizeBytes)} />
                <Spec label="Sales" value={String(product.salesCount || 0)} />
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        className="text-[10px] uppercase tracking-[0.24em]"
        style={{ color: 'var(--ink-soft)' }}
      >
        {label}
      </dt>
      <dd
        className="mt-1 text-[13px]"
        style={{ color: 'var(--ink)' }}
      >
        {value}
      </dd>
    </div>
  );
}
