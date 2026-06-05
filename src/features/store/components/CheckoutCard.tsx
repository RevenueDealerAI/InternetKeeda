'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Download as DownloadIcon } from 'lucide-react';
import { PriceTag, useStoreCurrency } from './PriceTag';
import { AddOnToggle } from './AddOnToggle';
import { AnimatedTotal } from './AnimatedTotal';
import { BuyButton } from './BuyButton';
import { STORE_ADDONS, sumAddOnInrMinor, sumAddOnUsdMinor } from '../lib/addons';
import { formatPrice } from '../lib/pricing';
import type { StoreCurrency } from '../config';

/**
 * The sticky right-side checkout panel on /store/[slug].
 *
 * Replaces the prior thin PriceTag + BuyButton stack with a richer
 * order-builder:
 *   - workflow base price (USD/INR toggle, persisted to localStorage)
 *   - selectable add-ons (highlighted upsell + future tiles)
 *   - live order summary with animated total
 *   - buy button that passes the chosen add-on ids through to
 *     /api/store/checkout/{cashfree|paypal}
 *
 * All add-on copy + pricing reads from src/features/store/lib/addons.ts.
 * To ship a new add-on, edit that file — no changes here.
 */
export function CheckoutCard({
  productId,
  priceUsdMinor,
  priceInrMinor,
}: {
  productId: string;
  priceUsdMinor: number;
  priceInrMinor: number;
}) {
  const [currency] = useStoreCurrency();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(STORE_ADDONS.filter((a) => a.defaultOn).map((a) => a.id));
  });

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedAddOns = useMemo(
    () => STORE_ADDONS.filter((a) => selectedIds.has(a.id)),
    [selectedIds]
  );

  const basePrice = currency === 'INR' ? priceInrMinor : priceUsdMinor;
  const addOnTotal =
    currency === 'INR'
      ? sumAddOnInrMinor(selectedAddOns)
      : sumAddOnUsdMinor(selectedAddOns);
  const grandTotal = basePrice + addOnTotal;

  return (
    <div
      className="rounded-2xl p-7"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <PriceTag
        priceUsdMinor={priceUsdMinor}
        priceInrMinor={priceInrMinor}
        size="lg"
        showToggle
      />
      <p
        className="mt-3 text-[12px]"
        style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
      >
        One-time purchase · lifetime download access
      </p>

      {/* Add-ons list */}
      {STORE_ADDONS.length > 0 && (
        <div className="mt-6">
          <div
            className="text-[10px] uppercase tracking-[0.24em] mb-2.5"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            Add-ons
          </div>
          <div className="flex flex-col gap-2.5">
            {STORE_ADDONS.map((a) => (
              <AddOnToggle
                key={a.id}
                addon={a}
                currency={currency as StoreCurrency}
                on={selectedIds.has(a.id)}
                onToggle={() => toggle(a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Order summary */}
      <div
        className="mt-7 rounded-xl p-4"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
        }}
      >
        <div className="flex items-baseline justify-between text-[13px]">
          <span style={{ color: 'var(--ink-2)' }}>Workflow</span>
          <span
            className="tabular-nums"
            style={{ color: 'var(--ink)' }}
          >
            {formatPrice(basePrice, currency as StoreCurrency)}
          </span>
        </div>
        <AnimatePresence initial={false}>
          {selectedAddOns.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="flex items-baseline justify-between text-[13px]">
                <span style={{ color: 'var(--ink-2)' }}>{a.name}</span>
                <span
                  className="tabular-nums"
                  style={{ color: 'var(--ink)' }}
                >
                  {formatPrice(
                    currency === 'INR' ? a.priceInrMinor : a.priceUsdMinor,
                    currency as StoreCurrency
                  )}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div
          className="mt-3 flex items-baseline justify-between pt-3"
          style={{ borderTop: '1px solid var(--rule)' }}
        >
          <span
            className="text-[11px] uppercase tracking-[0.22em]"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            Total
          </span>
          <AnimatedTotal
            value={grandTotal}
            currency={currency as StoreCurrency}
            size="lg"
          />
        </div>
      </div>

      <div className="mt-5">
        <BuyButton
          productId={productId}
          addOnIds={Array.from(selectedIds)}
          grandTotalMinor={grandTotal}
        />
      </div>

      <div
        className="mt-7 flex items-start gap-2 rounded-xl p-4 text-[12.5px] leading-[1.5]"
        style={{
          background: 'var(--surface)',
          color: 'var(--ink-2)',
          border: '1px solid var(--rule)',
        }}
      >
        <DownloadIcon
          className="h-4 w-4 shrink-0"
          style={{ color: 'var(--accent)' }}
        />
        <span>
          After purchase, this lives in{' '}
          <Link href="/store/my-downloads" style={{ color: 'var(--accent)' }}>
            My Downloads
          </Link>
          . You can re-download anytime.
        </span>
      </div>
    </div>
  );
}
