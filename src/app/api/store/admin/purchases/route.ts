/**
 * GET /api/store/admin/purchases — recent paid purchases.
 *
 * Drives the admin "Purchases" view + the "Needs follow-up"
 * highlight (anyone who bought Implementation Support or a future
 * add-on with a followUpTag).
 *
 * Query:
 *   ?needsFollowUp=1   only purchases with at least one unresolved
 *                       follow-up add-on
 *   ?limit=N           default 50, max 200
 *
 * PATCH /api/store/admin/purchases — mark a follow-up resolved.
 *   body: { purchaseId, resolved: true }
 *   Used by the admin "mark done" button after we set up the
 *   buyer's workflow / honour whatever add-on shipped.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { StorePurchase } from '@/features/store/models/StorePurchase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const a = await requireAdmin();
  if (a.kind !== 'ok') {
    return NextResponse.json(
      { error: a.kind },
      { status: a.kind === 'unauthenticated' ? 401 : 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const needsOnly = searchParams.get('needsFollowUp') === '1';
  const limit = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get('limit') || '50', 10))
  );

  await connectDB();
  const filter: Record<string, unknown> = { status: 'paid' };
  if (needsOnly) filter.needsFollowUp = true;

  const items = await StorePurchase.find(filter)
    .sort({ purchasedAt: -1 })
    .limit(limit)
    .select(
      'userId productSlug productTitle amountPaidMinor currency addOnIds addOnAmountMinor needsFollowUp followUpResolvedAt followUpResolvedBy purchasedAt provider'
    )
    .lean();

  return NextResponse.json({ data: items });
}

export async function PATCH(req: NextRequest) {
  const a = await requireAdmin();
  if (a.kind !== 'ok') {
    return NextResponse.json(
      { error: a.kind },
      { status: a.kind === 'unauthenticated' ? 401 : 403 }
    );
  }

  let body: { purchaseId?: string; resolved?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad-json' }, { status: 400 });
  }
  if (!body.purchaseId) {
    return NextResponse.json({ error: 'purchaseId-required' }, { status: 400 });
  }

  await connectDB();
  const doc = await StorePurchase.findByIdAndUpdate(
    body.purchaseId,
    body.resolved
      ? {
          $set: {
            needsFollowUp: false,
            followUpResolvedAt: new Date(),
            followUpResolvedBy: a.userId,
          },
        }
      : {
          $set: { needsFollowUp: true },
          $unset: { followUpResolvedAt: 1, followUpResolvedBy: 1 },
        },
    { new: true }
  );
  if (!doc) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json({ data: doc });
}
