"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  subscriptionDbId: string;
  /** subscription_session_id from Cashfree — hand to
   * `cashfree.subscriptionsCheckout({ subscriptionSessionId })`. */
  sessionId?: string;
  amount: number;
  currency: "USD";
  mode: "sandbox" | "production";
  resumed?: boolean;
}

export const useCreateSubscription = () =>
  useMutation({
    mutationFn: async (data: { toolId: string }): Promise<CreateSubscriptionResponse> => {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create subscription");
      }
      return res.json();
    },
  });

export interface MySubscription {
  id: string;
  subscriptionId: string;
  toolId: { _id: string; name: string; slug: string; logo?: string } | string;
  planId: string;
  amount: number;
  currency: string;
  status: "initialized" | "active" | "paused" | "cancelled" | "failed" | "expired";
  billingCycle: string;
  nextBillingDate?: string;
  currentPeriodEnd?: string;
  authorizationStatus?: string;
  failedRenewalCount: number;
  cancelledAt?: string;
  createdAt: string;
}

export const useMySubscriptions = (enabled = true) =>
  useQuery({
    queryKey: ["my-subscriptions"],
    queryFn: async (): Promise<{ subscriptions: MySubscription[] }> => {
      const r = await fetch("/api/subscriptions/my-subscriptions", {
        credentials: "include",
      });
      if (!r.ok) {
        if (r.status === 401) throw new Error("Not signed in");
        throw new Error("Failed to fetch subscriptions");
      }
      return r.json();
    },
    enabled,
  });

export const useCancelSubscription = () =>
  useMutation({
    mutationFn: async (data: { subscriptionId: string }) => {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to cancel");
      }
      return res.json();
    },
  });
