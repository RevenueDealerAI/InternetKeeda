"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Loader2 } from "lucide-react";

interface Status {
  subscriptionId: string;
  status: "initialized" | "active" | "paused" | "cancelled" | "failed" | "expired";
  amount: number;
  currency: string;
  authorizationStatus?: string;
  nextBillingDate?: string;
}

export default function SubscriptionReturnPage() {
  const params = useSearchParams();
  const router = useRouter();

  // Cashfree's redirect URL handling is unreliable — sometimes the
  // literal `{subscription_id}` placeholder survives substitution,
  // sometimes the SDK appends a different param name. Prefer the id
  // we stashed in localStorage right before redirecting. Fall back
  // to any of the URL params CF is known to use.
  const subscriptionId = useMemo<string | undefined>(() => {
    if (typeof window !== "undefined") {
      try {
        const stashed = window.localStorage.getItem(
          "ik_pending_subscription_id",
        );
        if (stashed) return stashed;
      } catch {
        // ignore — fall through to URL parsing
      }
    }
    const urlVal =
      params.get("subscription_id") ||
      params.get("subscriptionId") ||
      params.get("subs_id") ||
      undefined;
    // If CF passed the literal placeholder, treat it as no id.
    if (urlVal && /^\{.*\}$/.test(urlVal)) return undefined;
    return urlVal;
  }, [params]);

  // Clear the localStorage stash once we've reached a terminal state.
  useEffect(() => {
    return () => {
      try {
        window.localStorage.removeItem("ik_pending_subscription_id");
      } catch {
        // ignore
      }
    };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["subscription-status", subscriptionId],
    queryFn: async (): Promise<Status> => {
      const r = await fetch(
        `/api/subscriptions/status?subscriptionId=${encodeURIComponent(subscriptionId!)}`,
        { credentials: "include" },
      );
      if (!r.ok) throw new Error("Failed to fetch status");
      return r.json();
    },
    enabled: !!subscriptionId,
    refetchInterval: (q) => {
      const d = q.state.data as Status | undefined;
      if (!d || d.status === "initialized") return 3000;
      return false;
    },
  });

  useEffect(() => {
    if (data?.status === "active") {
      const t = setTimeout(() => router.push("/dashboard"), 3500);
      return () => clearTimeout(t);
    }
  }, [data?.status, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAFAFA] to-white px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] p-8 text-center">
        {!subscriptionId ? (
          <Missing />
        ) : isLoading || data?.status === "initialized" ? (
          <Pending subscriptionId={subscriptionId} />
        ) : error ? (
          <Failure title="Unable to verify your subscription" subId={subscriptionId} />
        ) : data?.status === "active" ? (
          <Success amount={data.amount} />
        ) : data?.status === "cancelled" ? (
          <Failure title="Subscription was cancelled" subId={subscriptionId} />
        ) : (
          <Failure
            title="Authorization did not complete"
            subId={subscriptionId}
            description={
              data?.authorizationStatus
                ? `Cashfree status: ${data.authorizationStatus}`
                : undefined
            }
          />
        )}
      </div>
    </main>
  );
}

function Missing() {
  return (
    <>
      <AlertCircle className="w-10 h-10 text-orange-500 mx-auto" />
      <h1 className="mt-3 text-lg font-semibold text-gray-900">Missing subscription reference</h1>
      <p className="mt-2 text-sm text-gray-600">
        We couldn&apos;t find a subscription_id in the URL. Check your dashboard for status.
      </p>
      <div className="mt-5">
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    </>
  );
}

function Pending({ subscriptionId }: { subscriptionId: string }) {
  return (
    <>
      <Loader2 className="w-10 h-10 text-orange-500 mx-auto animate-spin" />
      <h1 className="mt-3 text-lg font-semibold text-gray-900">Authorizing your subscription…</h1>
      <p className="mt-2 text-sm text-gray-600">
        Cashfree takes a few seconds to confirm. We&apos;ll auto-refresh as soon as it&apos;s active.
      </p>
      <p className="mt-3 text-[11px] text-gray-400">Subscription: {subscriptionId}</p>
    </>
  );
}

function Success({ amount }: { amount: number }) {
  const rupees = (amount / 100).toLocaleString("en-IN");
  return (
    <>
      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 grid place-items-center">
        <Check className="w-6 h-6 text-white" />
      </div>
      <h1 className="mt-3 text-lg font-semibold text-gray-900">Listing activated</h1>
      <p className="mt-2 text-sm text-gray-600">
        ₹{rupees}/month authorized. Your tool is now publicly visible.
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
  subId,
  description,
}: {
  title: string;
  subId: string;
  description?: string;
}) {
  return (
    <>
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
      <h1 className="mt-3 text-lg font-semibold text-gray-900">{title}</h1>
      {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
      <p className="mt-3 text-[11px] text-gray-400">Subscription: {subId}</p>
      <div className="mt-5">
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    </>
  );
}
