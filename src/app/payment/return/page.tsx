"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { usePaymentStatus } from "@/lib/api/payments";

export default function PaymentReturnPage() {
  const params = useSearchParams();
  const router = useRouter();

  // Cashfree path: ?order_id=…
  // PayPal path: ?provider=paypal&token=<order-id>&PayerID=…
  //   (PayPal calls the order id "token" in return-url query params)
  const provider = params.get("provider");
  const isPayPal = provider === "paypal";
  const orderId = (isPayPal ? params.get("token") : params.get("order_id")) || undefined;
  const cancelled = params.get("cancelled") === "1";

  // PayPal needs an explicit /capture call before its status moves to
  // COMPLETED. Fire that once on mount with the token, then let the
  // existing status-polling hook take over (it handles both providers
  // via Payment.provider). Idempotent on the server.
  const [captureRunning, setCaptureRunning] = useState(isPayPal && !cancelled && !!orderId);
  const [captureError, setCaptureError] = useState<string | null>(null);
  useEffect(() => {
    if (!isPayPal || cancelled || !orderId) {
      setCaptureRunning(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/payments/paypal/capture-boost-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderId }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          if (active) setCaptureError(body.error || "PayPal capture failed");
        }
      } catch (err) {
        if (active) setCaptureError(err instanceof Error ? err.message : "Network error");
      } finally {
        if (active) setCaptureRunning(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isPayPal, cancelled, orderId]);

  const { data, isLoading, error } = usePaymentStatus(orderId);

  // Once we hit a terminal success, give the user a beat to see the
  // confirmation then send them home. We deliberately don't auto-
  // redirect on failure — the user reads the error and clicks Retry.
  useEffect(() => {
    if (data?.status === "success") {
      const t = setTimeout(() => router.push("/dashboard"), 3500);
      return () => clearTimeout(t);
    }
  }, [data?.status, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAFAFA] to-white px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] p-8 text-center">
        {!orderId ? (
          <MissingOrderId />
        ) : cancelled ? (
          <Failure
            title="Payment cancelled"
            description="You cancelled before paying. No charge."
            orderId={orderId}
          />
        ) : captureRunning || isLoading || data?.status === "pending" ? (
          <Pending orderId={orderId} />
        ) : captureError && !data ? (
          <Failure
            title="Unable to capture your PayPal payment"
            description={captureError}
            orderId={orderId}
          />
        ) : error ? (
          <Failure
            title="Unable to verify your payment"
            description={error instanceof Error ? error.message : "Please try again."}
            orderId={orderId}
          />
        ) : data?.status === "success" ? (
          <Success amount={data.amount} productType={data.productType} />
        ) : data?.status === "refunded" ? (
          <Failure
            title="This order was refunded"
            description="If that was a mistake, contact support."
            orderId={orderId}
          />
        ) : (
          <Failure
            title="Payment did not complete"
            description={
              data?.status === "dropped"
                ? "Looks like you cancelled before paying. No charge."
                : "Cashfree reported the payment failed. No charge."
            }
            orderId={orderId}
          />
        )}
      </div>
    </main>
  );
}

function MissingOrderId() {
  return (
    <>
      <AlertCircle className="w-10 h-10 text-orange-500 mx-auto" />
      <h1 className="mt-3 text-lg font-semibold text-gray-900">Missing order reference</h1>
      <p className="mt-2 text-sm text-gray-600">
        We couldn&apos;t find an order_id in the URL. If you just paid, check your dashboard to see if it landed.
      </p>
      <div className="mt-5">
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    </>
  );
}

function Pending({ orderId }: { orderId: string }) {
  return (
    <>
      <Loader2 className="w-10 h-10 text-orange-500 mx-auto animate-spin" />
      <h1 className="mt-3 text-lg font-semibold text-gray-900">Confirming your payment…</h1>
      <p className="mt-2 text-sm text-gray-600">
        Cashfree takes a few seconds to confirm. We&apos;ll auto-refresh as soon as the receipt lands.
      </p>
      <p className="mt-3 text-[11px] text-gray-400">Order: {orderId}</p>
    </>
  );
}

function Success({
  amount,
  productType,
}: {
  amount: number;
  productType: string;
}) {
  const rupees = (amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
  });
  return (
    <>
      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 grid place-items-center">
        <Check className="w-6 h-6 text-white" />
      </div>
      <h1 className="mt-3 text-lg font-semibold text-gray-900">Boost activated</h1>
      <p className="mt-2 text-sm text-gray-600">
        ₹{rupees} captured. Your <code className="text-orange-600">{productType.replace(/^boost-/, "")}</code> boost is live now.
      </p>
      <p className="mt-3 text-[11px] text-gray-400">Redirecting to your dashboard…</p>
      <div className="mt-5">
        <Link href="/dashboard">
          <Button>Open dashboard</Button>
        </Link>
      </div>
    </>
  );
}

function Failure({
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
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
      <h1 className="mt-3 text-lg font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <p className="mt-3 text-[11px] text-gray-400">Order: {orderId}</p>
      <div className="mt-5 flex gap-2 justify-center">
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    </>
  );
}
