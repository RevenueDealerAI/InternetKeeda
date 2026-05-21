/**
 * React Query hooks for the Cashfree payment surface.
 *
 * Phase A: the old Stripe hooks and their /api/payments/* endpoints
 * are gone, so these are inert stubs that return empty data. The
 * dashboard "Purchases" tab still renders without crashing — it just
 * shows "No purchases yet". Phase B replaces these with real hooks:
 *
 *   useCreateBoostSession  → POST /api/payments/boost/create
 *   usePaymentStatus       → GET  /api/payments/status?orderId=
 *   useMyPurchases         → GET  /api/payments/my-purchases
 */

import { useMutation, useQuery } from "@tanstack/react-query";

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
      data: {
        toolId?: string;
        toolName?: string;
        toolUrl?: string;
        notes?: string;
      };
    }): Promise<Purchase> => {
      throw new Error(
        "Purchase editing is disabled during the Cashfree migration.",
      );
    },
  });
