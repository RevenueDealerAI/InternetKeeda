import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { BreadcrumbSSR } from '@/components/seo/BreadcrumbSSR';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { CheckoutCard } from './CheckoutCard';
import { STORE_BRAND } from '../config';
import { formatFileSize } from '../lib/pricing';
import { getWorkflowSalesContent } from '../lib/workflowSalesContent';
import type { StoreProductDetail } from '../types';

/**
 * Server-rendered product detail / sales page.
 *
 * Replaces the old client-only ProductDetailClient on /store/[slug].
 * EVERYTHING below is real HTML in the initial response — title,
 * description, the scannable sales sections, the spec table, the
 * breadcrumb, and the Product JSON-LD — so the page is fully
 * crawlable. The ONLY interactive island is <CheckoutCard>, which is
 * already a 'use client' component (currency toggle, guest form, PSP
 * buttons); it hydrates on top of the server markup.
 *
 * Products with enriched copy in workflowSalesContent.ts get the full
 * marketing layout (hook, before/after, benefits, who-it's-for,
 * requirements). Products without an entry render description +
 * includes only — so existing catalog items are unaffected.
 */

/** Map the private-blob cover URL to the public passthrough route, the
 *  same way /api/store/products does. The raw blob URL never ships. */
function publicCover(rawUrl: string | null | undefined, id: string): string {
  return rawUrl ? `/api/store/cover/${id}` : '';
}

function ProductJsonLd({
  product,
  canonical,
}: {
  product: StoreProductDetail;
  canonical: string;
}) {
  // Real data only — name, description, brand, and concrete price
  // offers in both currencies. NO aggregateRating / review counts: we
  // have no genuine review data, and inventing it is both dishonest and
  // a structured-data policy violation.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.shortDescription || product.description,
    category: 'n8n workflow template',
    brand: { '@type': 'Brand', name: STORE_BRAND.name },
    url: canonical,
    offers: [
      {
        '@type': 'Offer',
        price: (product.priceUsdMinor / 100).toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: canonical,
      },
      {
        '@type': 'Offer',
        price: (product.priceInrMinor / 100).toFixed(2),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: canonical,
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // Fully controlled shape; strings come from our own DB + config.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] uppercase tracking-[0.3em]"
      style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
    >
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="m-0 mt-5 flex flex-col gap-3 p-0">
      {items.map((line, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-[15px] leading-[1.6]"
          style={{ color: 'var(--ink-2)' }}
        >
          <span
            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

function Panel({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-7 ${className}`}
      style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)' }}
    >
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

export default function ProductDetailSSR({
  product,
}: {
  product: StoreProductDetail;
}) {
  const sales = getWorkflowSalesContent(product.slug);
  const coverUrl = publicCover(product.coverImageUrl, product._id);
  const canonical = `${SITE_ORIGIN}${STORE_BRAND.routeBase}/${product.slug}`;
  const categoryLabel = product.category.replace(/-/g, ' ');

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <ProductJsonLd product={product} canonical={canonical} />

      <div className="pt-[110px]">
        <BreadcrumbSSR
          items={[
            { label: 'Home', href: '/' },
            { label: STORE_BRAND.name, href: STORE_BRAND.routeBase },
            { label: product.title },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1080px] px-7 pb-24 pt-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
          {/* Left: identity + sales body */}
          <div>
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--rule)',
                aspectRatio: '16/9',
              }}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
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

            {sales?.hook ? (
              <p
                className="m-0 mt-5 text-[17px] leading-[1.6]"
                style={{ color: 'var(--ink)' }}
              >
                {sales.hook}
              </p>
            ) : null}

            {product.shortDescription && (
              <p
                className="m-0 mt-4 text-[16px] leading-[1.75]"
                style={{ color: 'var(--ink-2)' }}
              >
                {product.shortDescription}
              </p>
            )}

            {/* What it automates — before / after */}
            {sales?.whatItAutomates && (
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--rule)',
                  }}
                >
                  <SectionLabel>Without it</SectionLabel>
                  <p
                    className="m-0 mt-3 text-[14.5px] leading-[1.65]"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    {sales.whatItAutomates.before}
                  </p>
                </div>
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--accent-soft), transparent 70%)',
                    border: '1px solid var(--accent-soft)',
                  }}
                >
                  <SectionLabel>With this workflow</SectionLabel>
                  <p
                    className="m-0 mt-3 text-[14.5px] leading-[1.65]"
                    style={{ color: 'var(--ink)' }}
                  >
                    {sales.whatItAutomates.after}
                  </p>
                </div>
              </div>
            )}

            {/* Why it's worth it */}
            {sales?.benefits?.length ? (
              <Panel label="Why it's worth it" className="mt-6">
                <BulletList items={sales.benefits} />
              </Panel>
            ) : null}

            {/* What it does (long description) */}
            <Panel label="What it does" className="mt-6">
              <div
                className="mt-4 whitespace-pre-line text-[15.5px] leading-[1.75]"
                style={{ color: 'var(--ink-2)' }}
              >
                {product.description}
              </div>
            </Panel>

            {/* Who it's for */}
            {sales?.whoFor?.length ? (
              <Panel label="Who it's for" className="mt-6">
                <BulletList items={sales.whoFor} />
              </Panel>
            ) : null}

            {/* What's included */}
            {product.includes?.length > 0 && (
              <Panel label="What's included" className="mt-6">
                <BulletList items={product.includes} />
              </Panel>
            )}

            {/* What you need to run it */}
            {sales?.requirements?.length ? (
              <Panel label="What you need to run it" className="mt-6">
                <BulletList items={sales.requirements} />
                <p
                  className="m-0 mt-5 text-[13px] leading-[1.6]"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  This is an importable template you connect to your own
                  accounts — not a hosted or done-for-you service. Prefer we
                  set it up for you? Add Implementation Support at checkout.
                </p>
              </Panel>
            ) : null}

            {product.previewImages?.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {product.previewImages.map((url) => (
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

          {/* Right: buy panel (client island) */}
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
                <Spec label="Category" value={categoryLabel} />
                <Spec label="File" value={product.fileName} />
                <Spec label="Size" value={formatFileSize(product.fileSizeBytes)} />
                <Spec label="Sales" value={String(product.salesCount || 0)} />
              </dl>
              <div
                className="mt-5 text-center text-[11px] uppercase tracking-[0.22em]"
                style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
              >
                <Link href={STORE_BRAND.routeBase} className="inline-flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                  <ArrowLeft className="h-3 w-3" />
                  All {STORE_BRAND.name} workflows
                </Link>
              </div>
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
      <dd className="mt-1 text-[13px]" style={{ color: 'var(--ink)' }}>
        {value}
      </dd>
    </div>
  );
}
