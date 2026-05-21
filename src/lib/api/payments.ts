/**
 * React Query hooks for the Cashfree payment surface.
 *
 * Phase B: boost flow. Phase C will add the subscription hooks here.
 */

import { useMutation, useQuery } from "@tanstack/react-query";

// -- Legacy stubs so Dashboard.tsx purchases-tab compiles. The
// Cashfree-shaped equivalents are below; remove these in Phase D when
// the dashboard rebuild lands.

export interface Purchase {
  _id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
  status: "pending" | "active" | "expired" | "cancelled" | "refunded";
  startDate: string;
  endDate: string;
  toolId?: string;
  toolName?: string;
  toolUrl?: string;
  placement: "basic" | "featured" | "premium" | "sponsored";
  features: string[];
  analytics: { impressions: number; clicks: number; ctr: number };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const useUserPurchases = (userId?: string) =>
  useQuery({
    queryKey: ["user-purchases", userId],
    queryFn: async (): Promise<Purchase[]> => [],
    enabled: !!userId,
  });

export const useUpdatePurchase = () =>
  useMutation({
    mutationFn: async (_args: {
      purchaseId: string;
      data: { toolId?: string; toolName?: string; toolUrl?: string; notes?: string };
    }): Promise<Purchase> => {
      throw new Error("Purchase editing is disabled during the Cashfree migration.");
    },
  });

// -- New Cashfree boost hooks

export type BoostProductType =
  | "boost-category-top"
  | "boost-home-rotation"
  | "boost-featured-badge";

export interface CreateBoostResponse {
  paymentSessionId: string;
  orderId: string;
  paymentDbId: string;
  amount: number; // paise
  currency: "INR";
  productType: BoostProductType;
  boostDurationDays: number;
  mode: "sandbox" | "production";
}

export const useCreateBoost = () =>
  useMutation({
    mutationFn: async (data: {
      toolId: string;
      productType: BoostProductType;
    }): Promise<CreateBoostResponse> => {
      const res = await fetch("/api/payments/boost/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create boost");
      }
      return res.json();
    },
  });

export interface BoostPaymentStatus {
  orderId: string;
  status: "pending" | "success" | "failed" | "dropped" | "refunded";
  productType: BoostProductType;
  amount: number;
  currency: string;
  boostDurationDays: number;
  paidAt?: string;
  cashfreeOrderStatus?: string;
}

export const usePaymentStatus = (orderId: string | undefined) =>
  useQuery({
    queryKey: ["payment-status", orderId],
    queryFn: async (): Promise<BoostPaymentStatus> => {
      const res = await fetch(
        `/api/payments/status?orderId=${encodeURIComponent(orderId!)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        throw new Error("Failed to fetch payment status");
      }
      return res.json();
    },
    enabled: !!orderId,
    refetchInterval: (q) => {
      const d = q.state.data as BoostPaymentStatus | undefined;
      // Stop polling once we're terminal. Otherwise poll every 3 s.
      if (!d || d.status === "pending") return 3000;
      return false;
    },
  });

export interface MyBoostPurchase {
  id: string;
  orderId: string;
  toolId: { _id: string; name: string; slug: string; logo?: string } | string;
  amount: number;
  currency: string;
  productType: BoostProductType;
  boostDurationDays: number;
  status: "pending" | "success" | "failed" | "dropped" | "refunded";
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export const useMyBoosts = (enabled = true) =>
  useQuery({
    queryKey: ["my-boost-purchases"],
    queryFn: async (): Promise<{ payments: MyBoostPurchase[] }> => {
      const res = await fetch("/api/payments/my-purchases", {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Not signed in");
        throw new Error("Failed to fetch purchases");
      }
      return res.json();
    },
    enabled,
  });
