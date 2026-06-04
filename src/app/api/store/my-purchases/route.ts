/**
 * GET /api/store/my-purchases
 *
 * Signed-in buyer's download library. Returns one entry per paid
 * StorePurchase row — used by /store/my-downloads. The download URL
 * for each entry is `/api/store/download/{purchaseId}` (server-side
 * entitlement check on every request).
 */

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/user';
import { listUserPurchases } from '@/features/store/server/entitlements';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireUser();
  if (auth.kind !== 'ok') {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const purchases = await listUserPurchases(auth.userId);
  return NextResponse.json({
    data: purchases.map((p) => ({
      _id: String(p._id),
      productId: p.productId,
      productSlug: p.productSlug,
      productTitle: p.productTitle,
      purchasedAt: p.purchasedAt,
      amountPaidMinor: p.amountPaidMinor,
      currency: p.currency,
      downloadUrl: `/api/store/download/${String(p._id)}`,
    })),
  });
}
