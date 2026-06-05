'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { STORE_BRAND } from '../../config';
import { STORE_ADDONS, getAddOn } from '../../lib/addons';
import { formatPrice } from '../../lib/pricing';
import type { StoreCurrency } from '../../config';

interface AdminPurchaseRow {
  _id: string;
  userId: string;
  productSlug: string;
  productTitle: string;
  amountPaidMinor: number;
  currency: StoreCurrency;
  addOnIds: string[];
  addOnAmountMinor: number;
  needsFollowUp: boolean;
  followUpResolvedAt?: string;
  followUpResolvedBy?: string;
  purchasedAt: string;
  provider: 'cashfree' | 'paypal';
}

export default function AdminPurchasesList() {
  const [items, setItems] = useState<AdminPurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'needs'>('all');

  async function load() {
    setLoading(true);
    try {
      const url =
        filter === 'needs'
          ? '/api/store/admin/purchases?needsFollowUp=1'
          : '/api/store/admin/purchases';
      const res = await fetch(url);
      const data = await res.json();
      setItems(data?.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function toggleResolved(id: string, currentlyNeeds: boolean) {
    await fetch('/api/store/admin/purchases', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseId: id, resolved: currentlyNeeds }),
    });
    load();
  }

  const needsCount = items.filter((it) => it.needsFollowUp).length;

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1080px] px-7 pt-[140px] pb-24">
        <Link
          href="/store/admin"
          className="mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to products
        </Link>

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
                fontFamily: 'var(--sans)',
                fontSize: 38,
                fontWeight: 500,
                letterSpacing: '-0.03em',
              }}
            >
              Purchases
            </h1>
          </div>

          <div className="inline-flex overflow-hidden rounded-full text-[11px] uppercase tracking-[0.16em]"
               style={{ background: 'var(--surface)', border: '1px solid var(--rule)', fontFamily: 'var(--mono)' }}>
            {(['all', 'needs'] as const).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className="px-4 py-2 font-semibold transition-colors"
                  style={{
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'var(--on-accent)' : 'var(--ink-soft)',
                  }}
                >
                  {f === 'all' ? `All (${items.length})` : `Needs follow-up (${needsCount})`}
                </button>
              );
            })}
          </div>
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
                <th className="px-5 py-4 text-left">Buyer</th>
                <th className="px-5 py-4 text-left">Product</th>
                <th className="px-5 py-4 text-left">Add-ons</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-left">When</th>
                <th className="px-5 py-4 text-right" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center" style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center" style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>
                    {filter === 'needs' ? 'Nothing needs follow-up.' : 'No purchases yet.'}
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it._id} style={{ borderTop: '1px solid var(--rule)' }}>
                    <td className="px-5 py-4">
                      <div
                        className="font-mono text-[11px] truncate max-w-[160px]"
                        style={{ color: 'var(--ink)' }}
                        title={it.userId}
                      >
                        {it.userId}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--ink-soft)' }}>
                        {it.provider}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/store/${it.productSlug}`}
                        style={{ color: 'var(--ink)', fontWeight: 600 }}
                      >
                        {it.productTitle}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {it.addOnIds.length === 0 ? (
                        <span style={{ color: 'var(--ink-dim)' }}>—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {it.addOnIds.map((id) => {
                            const a = getAddOn(id);
                            const isFollowUp = a?.followUpTag && it.needsFollowUp;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]"
                                style={{
                                  background: isFollowUp ? 'var(--accent-soft)' : 'var(--surface)',
                                  color: isFollowUp ? 'var(--accent)' : 'var(--ink-soft)',
                                  border: '1px solid var(--rule)',
                                  fontFamily: 'var(--mono)',
                                  fontWeight: 600,
                                }}
                              >
                                {isFollowUp && <AlertCircle className="h-2.5 w-2.5" />}
                                {a?.name || id}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td
                      className="px-5 py-4 text-right tabular-nums"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {formatPrice(it.amountPaidMinor, it.currency)}
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--ink-2)' }}>
                      {new Date(it.purchasedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {it.addOnIds.some((id) => getAddOn(id)?.followUpTag) && (
                        <button
                          type="button"
                          onClick={() => toggleResolved(it._id, it.needsFollowUp)}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.16em]"
                          style={{
                            background: it.needsFollowUp ? 'var(--accent)' : 'var(--surface)',
                            color: it.needsFollowUp ? 'var(--on-accent)' : 'var(--ink-soft)',
                            border: it.needsFollowUp ? 'none' : '1px solid var(--rule)',
                            fontFamily: 'var(--mono)',
                            fontWeight: 600,
                          }}
                        >
                          {it.needsFollowUp ? (
                            <>
                              <Check className="h-3 w-3" /> Mark done
                            </>
                          ) : (
                            <>Reopen</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {STORE_ADDONS.length > 0 && (
          <div
            className="mt-8 rounded-2xl p-5 text-[12.5px]"
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--rule)',
              color: 'var(--ink-2)',
            }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.24em] mb-2"
              style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
            >
              Configured add-ons
            </div>
            <ul className="m-0 list-disc pl-5">
              {STORE_ADDONS.map((a) => (
                <li key={a.id}>
                  <strong style={{ color: 'var(--ink)' }}>{a.name}</strong>
                  {' — '}
                  {formatPrice(a.priceUsdMinor, 'USD' as StoreCurrency)} /{' '}
                  {formatPrice(a.priceInrMinor, 'INR' as StoreCurrency)}
                  {a.followUpTag && (
                    <span style={{ color: 'var(--accent)' }}> · needs follow-up</span>
                  )}
                </li>
              ))}
            </ul>
            <div
              className="mt-3 text-[11px]"
              style={{ color: 'var(--ink-soft)' }}
            >
              Edit in <code style={{ background: 'var(--surface)', padding: '1px 6px', borderRadius: 4 }}>src/features/store/lib/addons.ts</code>.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
