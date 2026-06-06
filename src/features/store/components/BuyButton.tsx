'use client';

import { useState } from 'react';
import { useStoreCurrency } from './PriceTag';
import type { StoreCurrency } from '../config';

/**
 * Reuses the existing payment SDKs:
 *   - INR → /api/store/checkout/cashfree returns paymentSessionId,
 *     then we load the Cashfree JS SDK and call cf.checkout().
 *   - USD → /api/store/checkout/paypal returns approveUrl, we
 *     redirect the buyer there (same as boost-create's PayPal flow).
 *
 * Sign-in is enforced by the API; if the user is anonymous we
 * surface a 401 message and prompt sign-in via the existing
 * /sign-in route.
 */

// Cashfree SDK is loaded as a global. Other modules in this repo
// declare it as `any` so we follow suit here (TS rejects conflicting
// global declarations across files) and cast at use sites.
type CashfreeFactory = (cfg: { mode: 'production' | 'sandbox' }) => {
  checkout: (opts: {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_modal';
  }) => Promise<unknown>;
};

const CF_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

async function loadCashfreeSdk(): Promise<CashfreeFactory> {
  if (typeof window === 'undefined') throw new Error('SSR call');
  const w = window as unknown as { Cashfree?: CashfreeFactory };
  if (w.Cashfree) return w.Cashfree;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CF_SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(s);
  });
  if (!w.Cashfree) throw new Error('Cashfree SDK did not initialize');
  return w.Cashfree;
}

export interface GuestBuyerInput {
  email: string;
  name?: string;
  phone?: string;
}

export function BuyButton({
  productId,
  addOnIds,
  grandTotalMinor,
  guest,
  disabled,
  label,
}: {
  productId: string;
  /** Optional canonical add-on IDs from CheckoutCard. Server re-
   *  validates against the canonical config, so a stale or hostile
   *  value here is dropped silently. */
  addOnIds?: string[];
  /** Total in minor units the buyer agreed to. Surfaced in the CTA
   *  label so the buyer sees the same number on the button they saw
   *  in the summary. The server still computes its own total from
   *  productId + addOnIds and ignores this value. */
  grandTotalMinor?: number;
  /** When the buyer chose "Continue as guest" we pass their form
   *  values. Server uses them to mint a guest_<random> userId and
   *  to populate the Cashfree customer_details / delivery email. */
  guest?: GuestBuyerInput | null;
  /** Disable the button (e.g. guest form not yet valid). */
  disabled?: boolean;
  /** Optional CTA label override. Default is "Pay in INR" / "Pay in USD". */
  label?: string;
}) {
  const [currency] = useStoreCurrency();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setBusy(true);
    setError(null);
    try {
      const route =
        currency === 'INR'
          ? '/api/store/checkout/cashfree'
          : '/api/store/checkout/paypal';
      const res = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          addOnIds: addOnIds ?? [],
          ...(guest ? { guest } : {}),
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        // If the buyer hasn't filled the guest form either, send them
        // to sign-in. Guest checkout that 401s usually means a stale
        // form payload — fall through to the visible error instead.
        if (!guest) {
          const next = encodeURIComponent(window.location.pathname);
          window.location.href = `/sign-in?redirect_url=${next}`;
          return;
        }
        setError(data?.message || 'Sign in or fill the guest form to continue.');
        return;
      }
      if (!res.ok) {
        setError(data?.message || data?.error || 'Checkout failed');
        return;
      }

      if (currency === 'USD') {
        if (!data.approveUrl) {
          setError('PayPal did not return an approve URL');
          return;
        }
        window.location.href = data.approveUrl;
        return;
      }

      const Cashfree = await loadCashfreeSdk();
      const cf = Cashfree({ mode: data.mode || 'sandbox' });
      await cf.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_self',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unexpected error';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleBuy}
        disabled={busy || disabled}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[13px] uppercase tracking-[0.16em] font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          background: 'var(--accent)',
          color: 'var(--on-accent)',
          fontFamily: 'var(--mono)',
          boxShadow: 'var(--shadow-accent)',
        }}
      >
        {busy ? 'Starting checkout…' : label || currencyLabel(currency)}
      </button>
      {error && (
        <span
          className="text-[12.5px]"
          style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

function currencyLabel(c: StoreCurrency): string {
  return c === 'INR' ? 'Pay in INR →' : 'Pay in USD →';
}
