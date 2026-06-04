/**
 * Entitlement checks — the only gate between a public download URL
 * and the underlying private file. Every download path must call
 * `getEntitlementForDownload` and fail closed if it returns null.
 */

import { connectDB } from '@/app/api/lib/db';
import {
  StorePurchase,
  type StorePurchaseDocument,
} from '../models/StorePurchase';

export interface EntitlementCheck {
  purchase: StorePurchaseDocument;
}

/**
 * Return the matching paid StorePurchase row, or null if:
 *   - purchase does not exist
 *   - purchase belongs to a different user
 *   - purchase is not in 'paid' status (refunded / pending both 403)
 */
export async function getEntitlementForDownload(
  purchaseId: string,
  userId: string
): Promise<EntitlementCheck | null> {
  await connectDB();
  const purchase = await StorePurchase.findById(purchaseId);
  if (!purchase) return null;
  if (purchase.userId !== userId) return null;
  if (purchase.status !== 'paid') return null;
  return { purchase };
}

/** All paid purchases for the current user — drives the My-Downloads page. */
export async function listUserPurchases(userId: string) {
  await connectDB();
  return StorePurchase.find({ userId, status: 'paid' })
    .sort({ purchasedAt: -1 })
    .lean();
}
