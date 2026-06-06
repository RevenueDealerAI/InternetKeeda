'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useClerkSession } from '@/hooks/useClerkSession';
import { Download as DownloadIcon, Mail as MailIcon } from 'lucide-react';
import { PriceTag, useStoreCurrency } from './PriceTag';
import { AddOnToggle } from './AddOnToggle';
import { AnimatedTotal } from './AnimatedTotal';
import { BuyButton, type GuestBuyerInput } from './BuyButton';
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
type GuestMode = 'choosing' | 'guest';

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
  // Cookie-based auth detection. ClerkProvider is NOT mounted at
  // root in this app — public routes use this hook so the Clerk SDK
  // never enters the critical path. Returns a boolean only; for the
  // signed-in path we still hand off to /sign-in / /store/my-downloads
  // (server-side gated) where the full Clerk session is in scope.
  const { isLoaded, isSignedIn } = useClerkSession();

  // Signed-in: skip the chooser entirely.
  // Signed-out: start in 'choosing' so the buyer picks sign-in or guest.
  const [guestMode, setGuestMode] = useState<GuestMode>('choosing');
  const [guestForm, setGuestForm] = useState<GuestBuyerInput>({
    email: '',
    name: '',
    phone: '',
  });

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

  // Validate the guest form locally so the BuyButton stays disabled
  // until the buyer has typed something we can send to the server.
  const guestEmailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.email.trim());
  const guestPhoneOk =
    !guestForm.phone || /^\+?\d{8,15}$/.test(guestForm.phone.replace(/[\s-]/g, ''));
  const guestNameOk = guestForm.name.trim().length > 0;
  const guestFormReady = guestEmailOk && guestNameOk && guestPhoneOk;

  // The actual guest payload we send. Trim whitespace on the wire.
  const guestPayload: GuestBuyerInput | null =
    !isSignedIn && guestMode === 'guest' && guestFormReady
      ? {
          email: guestForm.email.trim(),
          name: guestForm.name.trim() || undefined,
          phone: guestForm.phone
            ? guestForm.phone.replace(/[\s-]/g, '')
            : undefined,
        }
      : null;

  // Decide whether the BuyButton should be disabled and what
  // label to show. Three states:
  //   - signed in → button enabled, standard label
  //   - signed out, chooser still showing → button hidden
  //   - signed out, guest mode + form invalid → button disabled
  //     with an "Enter your details" label
  const buyDisabled =
    isLoaded && !isSignedIn && guestMode === 'guest' && !guestFormReady;
  const buyLabel = buyDisabled ? 'Enter your details' : undefined;
  const showBuyButton =
    !isLoaded || isSignedIn || (guestMode === 'guest');

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

      {/* Signed-out chooser: sign-in vs continue as guest. Renders ABOVE
          the BuyButton so the buyer makes the identity choice before
          clicking pay. Signed-in users never see this block. */}
      {isLoaded && !isSignedIn && (
        <div className="mt-5">
          {guestMode === 'choosing' ? (
            <div className="flex flex-col gap-2.5">
              <div
                className="text-[10px] uppercase tracking-[0.24em]"
                style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
              >
                Checkout
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/sign-in?redirect_url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
                  className="inline-flex flex-1 items-center justify-center rounded-full px-5 py-2.5 text-[11.5px] uppercase tracking-[0.16em] font-semibold transition-colors"
                  style={{
                    border: '1px solid var(--rule)',
                    color: 'var(--ink)',
                    background: 'var(--surface)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  Sign in
                </Link>
                <button
                  type="button"
                  onClick={() => setGuestMode('guest')}
                  className="inline-flex flex-1 items-center justify-center rounded-full px-5 py-2.5 text-[11.5px] uppercase tracking-[0.16em] font-semibold transition-colors hover:opacity-90"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--on-accent)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  Continue as guest
                </button>
              </div>
              <p
                className="text-[11.5px] leading-[1.5] mt-1"
                style={{ color: 'var(--ink-soft)' }}
              >
                Guest checkout sends the workflow to your email. Signed-in
                accounts also get a private library you can re-download from.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div
                  className="text-[10px] uppercase tracking-[0.24em] flex items-center gap-2"
                  style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
                >
                  <MailIcon
                    className="h-3 w-3"
                    style={{ color: 'var(--accent)' }}
                  />
                  Send to
                </div>
                <button
                  type="button"
                  onClick={() => setGuestMode('choosing')}
                  className="text-[10.5px] uppercase tracking-[0.18em] underline-offset-2 hover:underline"
                  style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
                >
                  ← Sign in instead
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Your name"
                  value={guestForm.name}
                  onChange={(e) =>
                    setGuestForm((g) => ({ ...g, name: e.target.value }))
                  }
                  className="rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--rule)',
                    color: 'var(--ink)',
                  }}
                />
                <input
                  type="email"
                  placeholder="Email — we'll send the workflow here"
                  value={guestForm.email}
                  onChange={(e) =>
                    setGuestForm((g) => ({ ...g, email: e.target.value }))
                  }
                  inputMode="email"
                  autoComplete="email"
                  className="rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${
                      guestForm.email && !guestEmailOk ? 'var(--accent)' : 'var(--rule)'
                    }`,
                    color: 'var(--ink)',
                  }}
                />
                <input
                  type="tel"
                  placeholder={
                    currency === 'INR'
                      ? 'Phone with country code (e.g. +9198…)'
                      : 'Phone (optional)'
                  }
                  value={guestForm.phone}
                  onChange={(e) =>
                    setGuestForm((g) => ({ ...g, phone: e.target.value }))
                  }
                  inputMode="tel"
                  autoComplete="tel"
                  className="rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${
                      guestForm.phone && !guestPhoneOk ? 'var(--accent)' : 'var(--rule)'
                    }`,
                    color: 'var(--ink)',
                  }}
                />
              </div>
              <p
                className="text-[11.5px] leading-[1.5]"
                style={{ color: 'var(--ink-soft)' }}
              >
                No account needed. We send the workflow zip + a receipt to
                this email after payment clears.
              </p>
            </motion.div>
          )}
        </div>
      )}

      {showBuyButton && (
        <div className="mt-5">
          <BuyButton
            productId={productId}
            addOnIds={Array.from(selectedIds)}
            grandTotalMinor={grandTotal}
            guest={guestPayload}
            disabled={buyDisabled}
            label={buyLabel}
          />
        </div>
      )}

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
        {isLoaded && !isSignedIn && guestMode === 'guest' ? (
          <span>
            After payment clears we email the workflow zip to the address
            above. Reply to that email anytime to re-download.
          </span>
        ) : (
          <span>
            After purchase, this lives in{' '}
            <Link href="/store/my-downloads" style={{ color: 'var(--accent)' }}>
              My Downloads
            </Link>
            . You can re-download anytime.
          </span>
        )}
      </div>
    </div>
  );
}
