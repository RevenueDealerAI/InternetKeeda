'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Pencil,
  Plus,
  Trash2,
  Eye,
  Rocket,
  Undo2,
  Workflow as WorkflowIcon,
} from 'lucide-react';
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
  const [busyId, setBusyId] = useState<string | null>(null);

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

  /** One-click status change (publish / unpublish) straight from the
   *  list — no need to open the edit form. Hits the same PATCH route
   *  the edit form uses. */
  async function setStatus(id: string, status: AdminProductRow['status']) {
    setBusyId(id);
    try {
      await fetch(`/api/store/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function archive(id: string) {
    if (!confirm('Archive this product? It will be hidden from the catalog.'))
      return;
    setBusyId(id);
    try {
      await fetch(`/api/store/admin/products/${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const workflows = items.filter((i) => i.category === 'n8n-workflow');

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
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/store/admin/purchases"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] font-semibold"
              style={{
                background: 'var(--surface)',
                color: 'var(--ink)',
                border: '1px solid var(--rule)',
                fontFamily: 'var(--mono)',
              }}
            >
              Purchases
            </Link>
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
        </div>

        {/* ───────────── Workflows section — quick publish controls ─────────────
            Surfaces the n8n workflow products with one-click publish/
            unpublish, edit, and view-live, so an admin never has to know
            a product id or dig through the full table to go live. */}
        <section className="mt-12">
          <div className="flex items-center gap-2.5">
            <WorkflowIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <h2
              className="m-0 text-[13px] uppercase tracking-[0.24em]"
              style={{ color: 'var(--ink)', fontFamily: 'var(--mono)', fontWeight: 600 }}
            >
              Workflows
            </h2>
            <span
              className="text-[11px]"
              style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
            >
              {workflows.length} · n8n
            </span>
          </div>
          <p
            className="mt-2 text-[12.5px] leading-[1.6]"
            style={{ color: 'var(--ink-soft)' }}
          >
            Publish to make a workflow live and buyable at /store. Unpublish
            flips it back to a draft (hidden from the catalog, existing
            downloads unaffected).
          </p>

          {loading ? (
            <div
              className="mt-6 rounded-2xl px-5 py-10 text-center text-[13px]"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--rule)',
                color: 'var(--ink-soft)',
                fontFamily: 'var(--mono)',
              }}
            >
              Loading…
            </div>
          ) : workflows.length === 0 ? (
            <div
              className="mt-6 rounded-2xl px-5 py-10 text-center text-[13px]"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--rule)',
                color: 'var(--ink-soft)',
                fontFamily: 'var(--mono)',
              }}
            >
              No workflow products yet.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {workflows.map((it) => (
                <WorkflowCard
                  key={it._id}
                  item={it}
                  busy={busyId === it._id}
                  onPublish={() => setStatus(it._id, 'published')}
                  onUnpublish={() => setStatus(it._id, 'draft')}
                  onArchive={() => archive(it._id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ───────────── Full catalog table (all products) ───────────── */}
        <h2
          className="m-0 mt-14 mb-4 text-[13px] uppercase tracking-[0.24em]"
          style={{ color: 'var(--ink-2)', fontFamily: 'var(--mono)', fontWeight: 600 }}
        >
          All products
        </h2>
        <div
          className="overflow-hidden rounded-2xl"
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

function WorkflowCard({
  item,
  busy,
  onPublish,
  onUnpublish,
  onArchive,
}: {
  item: AdminProductRow;
  busy: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
}) {
  const isPublished = item.status === 'published';
  return (
    <div
      className="flex flex-col rounded-2xl p-5"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        opacity: busy ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="truncate text-[15px]"
            style={{ color: 'var(--ink)', fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            {item.title}
          </div>
          <div
            className="mt-0.5 truncate text-[11px]"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            /store/{item.slug} · {formatPrice(item.priceInrMinor, 'INR')} ·{' '}
            {formatPrice(item.priceUsdMinor, 'USD')}
          </div>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {isPublished ? (
          <button
            type="button"
            disabled={busy}
            onClick={onUnpublish}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold disabled:cursor-not-allowed"
            style={{
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--rule)',
              fontFamily: 'var(--mono)',
            }}
          >
            <Undo2 className="h-3.5 w-3.5" />
            Unpublish
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={onPublish}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold disabled:cursor-not-allowed"
            style={{
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontFamily: 'var(--mono)',
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            <Rocket className="h-3.5 w-3.5" />
            {busy ? 'Working…' : 'Publish'}
          </button>
        )}

        <Link
          href={`/store/admin/${item._id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold"
          style={{
            background: 'var(--surface)',
            color: 'var(--ink-2)',
            border: '1px solid var(--rule)',
            fontFamily: 'var(--mono)',
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>

        <Link
          href={`/store/${item.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.14em] font-semibold"
          style={{
            background: 'var(--surface)',
            color: 'var(--ink-2)',
            border: '1px solid var(--rule)',
            fontFamily: 'var(--mono)',
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          {isPublished ? 'View live' : 'Preview'}
        </Link>

        <button
          type="button"
          disabled={busy}
          onClick={onArchive}
          className="ml-auto inline-grid h-8 w-8 place-items-center rounded-full disabled:cursor-not-allowed"
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
    </div>
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
