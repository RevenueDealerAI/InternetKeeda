'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { STORE_BRAND } from '../../config';
import { formatPrice } from '../../lib/pricing';

interface AdminProductRow {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  category: string;
  priceUsdMinor: number;
  priceInrMinor: number;
  salesCount: number;
  createdAt: string;
}

export default function AdminProductList() {
  const [items, setItems] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/store/admin/products');
      const data = await res.json();
      setItems(data?.data || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function archive(id: string) {
    if (!confirm('Archive this product? It will be hidden from the catalog.'))
      return;
    await fetch(`/api/store/admin/products/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1080px] px-7 pt-[140px] pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              className="text-[11px] uppercase tracking-[0.3em]"
              style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
            >
              § {STORE_BRAND.name.toLowerCase()} · admin
            </div>
            <h1
              className="m-0 mt-3"
              style={{
                color: 'var(--ink)',
                fontFamily: 'var(--sans)',
                fontSize: 38,
                fontWeight: 500,
                letterSpacing: '-0.03em',
              }}
            >
              Products
            </h1>
          </div>
          <Link
            href="/store/admin/new"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] font-semibold"
            style={{
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontFamily: 'var(--mono)',
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New product
          </Link>
        </div>

        <div
          className="mt-10 overflow-hidden rounded-2xl"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--rule)',
          }}
        >
          <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  color: 'var(--ink-soft)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                <th className="px-5 py-4 text-left">Title</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Category</th>
                <th className="px-5 py-4 text-right">USD</th>
                <th className="px-5 py-4 text-right">INR</th>
                <th className="px-5 py-4 text-right">Sales</th>
                <th className="px-5 py-4 text-right" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center"
                    style={{
                      color: 'var(--ink-soft)',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center"
                    style={{
                      color: 'var(--ink-soft)',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    No products yet. Create your first.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr
                    key={it._id}
                    style={{ borderTop: '1px solid var(--rule)' }}
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/store/admin/${it._id}/edit`}
                        style={{ color: 'var(--ink)', fontWeight: 600 }}
                      >
                        {it.title}
                      </Link>
                      <div
                        className="mt-0.5 text-[11px]"
                        style={{ color: 'var(--ink-soft)' }}
                      >
                        /{it.slug}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={it.status} />
                    </td>
                    <td
                      className="px-5 py-4"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {it.category.replace(/-/g, ' ')}
                    </td>
                    <td
                      className="px-5 py-4 text-right tabular-nums"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {formatPrice(it.priceUsdMinor, 'USD')}
                    </td>
                    <td
                      className="px-5 py-4 text-right tabular-nums"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {formatPrice(it.priceInrMinor, 'INR')}
                    </td>
                    <td
                      className="px-5 py-4 text-right tabular-nums"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {it.salesCount}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/store/admin/${it._id}/edit`}
                          className="inline-grid h-8 w-8 place-items-center rounded-full"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--rule)',
                            color: 'var(--ink-2)',
                          }}
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => archive(it._id)}
                          className="inline-grid h-8 w-8 place-items-center rounded-full"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--rule)',
                            color: 'var(--accent)',
                          }}
                          aria-label="Archive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === 'published'
      ? 'var(--accent)'
      : status === 'draft'
        ? 'var(--ink-soft)'
        : 'var(--ink-dim)';
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.22em]"
      style={{
        background: 'var(--surface)',
        color,
        border: '1px solid var(--rule)',
        fontFamily: 'var(--mono)',
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}
