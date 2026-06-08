'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  AlertCircle,
  Loader2,
  Download as DownloadIcon,
  ArrowRight,
} from 'lucide-react';
import { STORE_BRAND } from '../config';
import { formatPrice } from '../lib/pricing';
import type { StoreCurrency } from '../config';

/**
 * /store/payment/return — mirrors /payment/return but routes through
 * the store-specific status + capture endpoints.
 *
 * Query shapes (both providers):
 *   Cashfree    ?order_id=store_<paymentDbId>_<ts>
 *   PayPal OK   ?provider=paypal&payment_db_id=<id>&token=<orderId>&PayerID=<x>
 *   Cancelled   ?provider=paypal&cancelled=1&payment_db_id=<id>
 *
 * After a successful payment the page surfaces the matching
 * StorePurchase id and links directly to the download + My Downloads.
 */

interface StatusResponse {
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'dropped' | 'refunded';
  provider: 'cashfree' | 'paypal';
  amount: number;
  currency: StoreCurrency;
  paidAt?: string;
  purchaseId?: string;
  productSlug?: string;
  productTitle?: string;
  /** Set by the status endpoint for guest_* payments. Drives the
   *  "check your email" branch on the success card — guests have no
   *  /store/my-downloads access, so we point them at the email
   *  instead of an in-app download link. */
  isGuest?: boolean;
}

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60_000;

export default function PaymentReturnClient() {
  const params = useSearchParams();

  const provider = params.get('provider');
  const isPayPal = provider === 'paypal';
  const cancelled = params.get('cancelled') === '1';

  // Cashfree returns the order_id directly. PayPal appends `token` to
  // the returnUrl which IS the order id we tagged in our /paypal route.
  const orderId =
    (isPayPal ? params.get('token') : params.get('order_id')) || undefined;

  const [captureRunning, setCaptureRunning] = useState(
    isPayPal && !cancelled && !!orderId
  );
  const [captureError, setCaptureError] = useState<string | null>(null);

  // PayPal needs an explicit capture call before status moves to
  // COMPLETED. Fire once on mount.
  useEffect(() => {
    if (!isPayPal || cancelled || !orderId) {
      setCaptureRunning(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const r = await fetch('/api/store/checkout/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ orderId }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          if (active) setCaptureError(body.error || 'PayPal capture failed');
        }
      } catch (err) {
        if (active) {
          setCaptureError(
            err instanceof Error ? err.message : 'Network error'
          );
        }
      } finally {
        if (active) setCaptureRunning(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isPayPal, cancelled, orderId]);

  // Poll until terminal status or timeout.
  const [data, setData] = useState<StatusResponse | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  useEffect(() => {
    if (!orderId || cancelled || captureRunning) return;
    let active = true;
    const start = Date.now();

    async function tick() {
      try {
        const r = await fetch(
          `/api/store/checkout/status?orderId=${encodeURIComponent(orderId!)}`,
          { credentials: 'include' }
        );
        const body = await r.json();
        if (!r.ok) {
          if (active) setPollError(body?.error || 'Failed to read status');
          return;
        }
        if (active) setData(body as StatusResponse);
        if (body?.status && body.status !== 'pending') return; // terminal
        if (Date.now() - start > POLL_TIMEOUT_MS) {
          // We've waited long enough. Stop spinning — surface the
          // ambiguous-state UX so the buyer can act (try again, check
          // email, contact support). The server will also auto-fail
          // the row at the 30-minute mark; the next visit to this URL
          // will then see a terminal "failed" status and show the
          // failure card directly.
          if (active) setPollTimedOut(true);
          return;
        }
        if (active) setTimeout(tick, POLL_INTERVAL_MS);
      } catch (err) {
        if (active) {
          setPollError(
            err instanceof Error ? err.message : 'Network error'
          );
        }
      }
    }
    tick();
    return () => {
      active = false;
    };
  }, [orderId, cancelled, captureRunning]);

  const showCancelled = cancelled;
  const showMissing = !orderId && !cancelled;
  const stillPending = captureRunning || !data || data.status === 'pending';
  const showPending =
    !showCancelled && !showMissing && stillPending && !pollTimedOut;
  const showPollTimeout =
    !showCancelled && !showMissing && stillPending && pollTimedOut;
  const showSuccess = !showCancelled && !showMissing && data?.status === 'success';
  const showRefunded = data?.status === 'refunded';

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[560px] px-7 pt-[140px] pb-24">
        <div
          className="rounded-2xl p-9 text-center"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--rule)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {showMissing ? (
            <MissingOrder />
          ) : showCancelled ? (
            <Cancelled orderId={orderId} />
          ) : captureError && (!data || data.status === 'pending') ? (
            // Capture errors are stronger evidence than a "still pending"
            // status — PayPal has actively told us something is wrong.
            // Surface that immediately instead of spinning a "confirming"
            // UI that will only resolve at the 30-minute stale-fail mark.
            <FailureCard
              title="Unable to capture your PayPal payment"
              description={captureError}
              orderId={orderId!}
            />
          ) : showPending ? (
            <Pending orderId={orderId!} />
          ) : showPollTimeout ? (
            <PollTimeout orderId={orderId!} />
          ) : showSuccess ? (
            <SuccessCard data={data!} />
          ) : showRefunded ? (
            <FailureCard
              title="This order was refunded"
              description="If that was a mistake, contact us via Connect on WhatsApp."
              orderId={orderId!}
            />
          ) : pollError ? (
            <FailureCard
              title="Unable to verify your payment"
              description={pollError}
              orderId={orderId!}
            />
          ) : (
            <FailureCard
              title="Payment did not complete"
              description={
                data?.status === 'dropped'
                  ? 'Looks like you cancelled before paying. No charge.'
                  : 'The provider reported the payment did not complete. No charge.'
              }
              orderId={orderId!}
            />
          )}
        </div>
      </div>
    </main>
  );
}

/* ───────── view fragments ───────── */

function MissingOrder() {
  return (
    <>
      <Icon kind="warn" />
      <Heading>Missing order reference</Heading>
      <Body>
        We could not find an order in the URL. If you just paid, check{' '}
        <Link href="/store/my-downloads" style={{ color: 'var(--accent)' }}>
          My Downloads
        </Link>{' '}
        to see if it landed.
      </Body>
      <CtaRow>
        <PrimaryButton href="/store/my-downloads">Go to My Downloads</PrimaryButton>
      </CtaRow>
    </>
  );
}

function Cancelled({ orderId }: { orderId?: string }) {
  return (
    <>
      <Icon kind="warn" />
      <Heading>Payment cancelled</Heading>
      <Body>You cancelled before paying. No charge.</Body>
      {orderId && <OrderMeta orderId={orderId} />}
      <CtaRow>
        <PrimaryButton href={STORE_BRAND.routeBase}>Back to {STORE_BRAND.name}</PrimaryButton>
      </CtaRow>
    </>
  );
}

function Pending({ orderId }: { orderId: string }) {
  return (
    <>
      <Loader2
        className="h-10 w-10 mx-auto animate-spin"
        style={{ color: 'var(--accent)' }}
      />
      <Heading>Confirming your payment…</Heading>
      <Body>
        The provider takes a few seconds to confirm. This page auto-refreshes as soon as the receipt lands.
      </Body>
      <OrderMeta orderId={orderId} />
    </>
  );
}

function SuccessCard({ data }: { data: StatusResponse }) {
  const price = formatPrice(data.amount, data.currency);
  const isGuest = !!data.isGuest;
  return (
    <>
      <div
        className="mx-auto grid h-12 w-12 place-items-center rounded-full"
        style={{
          background: 'var(--accent)',
          color: 'var(--on-accent)',
        }}
      >
        <Check className="h-6 w-6" />
      </div>
      <Heading>Purchase confirmed</Heading>
      {isGuest ? (
        <Body>
          {price} captured. We've emailed{' '}
          {data.productTitle ? `“${data.productTitle}”` : 'your workflow'} —
          the ZIP is attached. Reply to that email anytime to re-download or
          get help.
        </Body>
      ) : (
        <Body>
          {price} captured. Your{' '}
          {data.productTitle ? `“${data.productTitle}”` : 'download'} is ready
          in My Downloads — re-download anytime.
        </Body>
      )}
      <OrderMeta orderId={data.orderId} />
      <CtaRow>
        {isGuest ? (
          <PrimaryButton href={STORE_BRAND.routeBase}>
            Back to {STORE_BRAND.name}
            <ArrowRight className="h-3.5 w-3.5" />
          </PrimaryButton>
        ) : (
          <>
            {data.purchaseId && (
              <PrimaryButton href={`/api/store/download/${data.purchaseId}`}>
                <DownloadIcon className="h-3.5 w-3.5" />
                Download now
              </PrimaryButton>
            )}
            <GhostButton href="/store/my-downloads">
              My Downloads
              <ArrowRight className="h-3.5 w-3.5" />
            </GhostButton>
          </>
        )}
      </CtaRow>
    </>
  );
}

function PollTimeout({ orderId }: { orderId: string }) {
  return (
    <>
      <Icon kind="warn" />
      <Heading>Still confirming with the bank…</Heading>
      <Body>
        Your payment can take a few minutes after you leave the bank page. If
        it lands you'll get an email with the workflow attached — signed-in
        accounts also find it in{' '}
        <Link href="/store/my-downloads" style={{ color: 'var(--accent)' }}>
          My Downloads
        </Link>
        . If nothing arrives in 10 minutes the order will be cancelled
        automatically with no charge.
      </Body>
      <OrderMeta orderId={orderId} />
      <CtaRow>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] font-semibold transition-transform hover:-translate-y-0.5"
          style={{
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            fontFamily: 'var(--mono)',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          Re-check now
        </button>
        <GhostButton href={STORE_BRAND.routeBase}>
          Back to {STORE_BRAND.name}
        </GhostButton>
      </CtaRow>
    </>
  );
}

function FailureCard({
  title,
  description,
  orderId,
}: {
  title: string;
  description: string;
  orderId: string;
}) {
  return (
    <>
      <Icon kind="warn" />
      <Heading>{title}</Heading>
      <Body>{description}</Body>
      <OrderMeta orderId={orderId} />
      <CtaRow>
        <PrimaryButton href={STORE_BRAND.routeBase}>Back to {STORE_BRAND.name}</PrimaryButton>
      </CtaRow>
    </>
  );
}

function Icon({ kind }: { kind: 'warn' | 'ok' }) {
  return (
    <AlertCircle
      className="h-10 w-10 mx-auto"
      style={{ color: kind === 'warn' ? 'var(--accent)' : 'var(--accent)' }}
    />
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="m-0 mt-4"
      style={{
        color: 'var(--ink)',
        fontFamily: 'var(--sans)',
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: '-0.02em',
      }}
    >
      {children}
    </h1>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="m-0 mx-auto mt-3 max-w-[420px] text-[14px] leading-[1.6]"
      style={{ color: 'var(--ink-2)' }}
    >
      {children}
    </p>
  );
}

function OrderMeta({ orderId }: { orderId: string }) {
  return (
    <p
      className="mt-4 text-[11px]"
      style={{
        color: 'var(--ink-soft)',
        fontFamily: 'var(--mono)',
        letterSpacing: '0.04em',
      }}
    >
      Order: {orderId}
    </p>
  );
}

function CtaRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>;
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] font-semibold transition-transform hover:-translate-y-0.5"
      style={{
        background: 'var(--accent)',
        color: 'var(--on-accent)',
        fontFamily: 'var(--mono)',
        boxShadow: 'var(--shadow-accent)',
      }}
    >
      {children}
    </a>
  );
}

function GhostButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em]"
      style={{
        background: 'var(--surface)',
        color: 'var(--ink-2)',
        border: '1px solid var(--rule)',
        fontFamily: 'var(--mono)',
        fontWeight: 600,
      }}
    >
      {children}
    </Link>
  );
}
