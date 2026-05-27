"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

/**
 * Landing page for the PayPal subscription cancelUrl. PayPal sends
 * the buyer here if they bail out of the approval screen before
 * confirming. No state to clean up server-side — the Mongo
 * Subscription row stays 'initialized' and either gets resumed by
 * the user clicking Activate again (which finds the existing row)
 * or aged out by the polling self-heal.
 */
export default function SubscriptionCancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAFAFA] to-white px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] p-8 text-center">
        <AlertCircle className="w-10 h-10 text-orange-500 mx-auto" />
        <h1 className="mt-3 text-lg font-semibold text-gray-900">
          Subscription not started
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          You backed out before approving. No charge — your tool is still
          waiting for activation. Try again from your dashboard whenever
          you&apos;re ready.
        </p>
        <div className="mt-5 flex gap-2 justify-center">
          <Link href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
