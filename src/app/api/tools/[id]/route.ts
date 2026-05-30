import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { requireUser } from '@/lib/auth/user';
import { requireAdmin } from '@/lib/auth/admin';
import { formatTool } from '../../lib/formatTool';
import { Tool } from '../../models/Tool';
import { Category } from '../../models/Category';
import { Subscription } from '../../models/Subscription';
import { Payment } from '../../models/Payment';
import { cancelSubscription as cancelPayPalSubscription, PayPalError } from '@/lib/paypal';
import { z } from 'zod';
import mongoose from 'mongoose';

const toolSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    websiteUrl: z.string().url("Please enter a valid URL"),
    category: z.string().min(1, "Please select a category"),
    tags: z.array(z.string()).min(1, "Add at least one tag"),
    pricing: z.object({
        type: z.enum(["free", "freemium", "paid", "enterprise"], {
            required_error: "Please select a pricing type",
        }),
        startingPrice: z.union([
            z.string().transform((val) => {
                const parsed = parseFloat(val);
                return isNaN(parsed) ? undefined : parsed;
            }),
            z.number(),
            z.undefined()
        ]),
    }),
    features: z.array(z.string()).min(1, "Add at least one feature"),
    logo: z.string().optional(),
    status: z.enum(["draft", "published", "archived", "pending", "approved", "rejected"]).default("draft"),
    isTrending: z.boolean().optional(),
    isNew: z.boolean().optional(),
    isUpcoming: z.boolean().optional(),
    isTopRated: z.boolean().optional(),
    views: z.number().default(0),
    votes: z.number().default(0),
    rating: z.number().default(0),
    reviews: z.number().default(0),
    slug: z.string().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        let tool = await Tool.findOne({ slug: id });

        if (!tool && mongoose.Types.ObjectId.isValid(id)) {
            tool = await Tool.findById(id);
        }

        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        // Soft-deleted tools are 404 on public reads. Admin views
        // request them via /api/admin/tools/[id] (or /api/tools
        // with includeDeleted=true).
        if (tool.deletedAt) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        tool.views += 1;
        await tool.save();

        const formattedTool = formatTool(tool);

        return NextResponse.json(formattedTool);
    } catch (error: unknown) {
        console.error('Error fetching tool:', error);
        return errorResponse('Failed to fetch tool', 500);
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        await requireAuth();
        
        const { id } = await params;
        const body = await req.json();
        const updateData = toolSchema.partial().parse(body);
        
        const dbUpdateData = {
            ...updateData,
            isNewTool: updateData.isNew,
            updatedAt: new Date()
        };

        const updatedTool = await Tool.findByIdAndUpdate(
            id,
            dbUpdateData,
            { new: true, runValidators: true }
        );

        if (!updatedTool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        const formattedTool = {
            ...updatedTool.toObject(),
            _id: updatedTool._id.toString(),
            id: updatedTool._id.toString(),
            isNew: updatedTool.isNewTool
        };

        return NextResponse.json(formattedTool);
    } catch (error: unknown) {
        console.error('Error updating tool:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to update tool', 500);
    }
}

/**
 * DELETE /api/tools/[id]
 *
 * Owner self-delete (or admin escape hatch) with payment-history
 * guards. Soft-delete only; Payment + Subscription rows referencing
 * the tool stay intact.
 *
 * Body: { confirmForfeitBoost?: boolean }
 *
 * Response codes:
 *   200 → { deletedAt }
 *   401 → unauthenticated
 *   403 → { error: 'NOT_OWNER' }
 *   409 → { error: 'ACTIVE_SUBSCRIPTION', subscriptionId }
 *   409 → { error: 'BOOST_FORFEIT_NOT_CONFIRMED', earliestBoostExpiresAt }
 *
 * Guard order (first match wins):
 *   1. Ownership (skipped for admin)
 *   2. Active subscription (status in ['active', 'paused']) — block
 *      unless caller confirms via the subscription-cancel flow first
 *   3. Active boost (Tool.activeBoosts non-empty AND any
 *      Tool.boostExpiresAt[slot] > now) — require
 *      confirmForfeitBoost === true to proceed
 *   4. Otherwise → soft-delete
 *
 * Side effects on success:
 *   - Tool: deletedAt = now, deletedBy = auth.userId,
 *     deletionSource = 'user' | 'admin'
 *   - Initialized / paused / failed Subscription rows for this
 *     tool + user flip to 'cancelled' (best-effort PayPal cancel
 *     for paypal rows). Active subs are NOT auto-cancelled —
 *     guard 2 blocks delete in that case.
 *   - Pending Payment rows flip to 'dropped' so they don't loiter
 *     in admin pending-payments. Successful / refunded rows stay.
 *   - revalidatePath() for every surface that lists this tool so
 *     the catalog reflects the removal within seconds, not the
 *     React-Query staleTime.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const auth = await requireUser();
    if (auth.kind !== 'ok') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const tool = await Tool.findById(id);
    if (!tool || tool.deletedAt) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Admin escape hatch: an admin user can delete any tool through
    // this route too. The dedicated /api/admin/tools/[id] route has
    // richer cleanup (Cashfree subscription cancel + comprehensive
    // revalidation); admins should prefer that one, but this route
    // accepts admin callers so an admin-as-owner edge case doesn't
    // 403 itself.
    const adminCheck = await requireAdmin();
    const isAdmin = adminCheck.kind === 'ok';
    if (!isAdmin && tool.ownerUserId !== auth.userId) {
      return NextResponse.json({ error: 'NOT_OWNER' }, { status: 403 });
    }
    if (!isAdmin && tool.listingStatus === 'free-seeded') {
      // Seeded directory rows have no real owner. Bail before the
      // sub/boost guards so the error reads correctly.
      return NextResponse.json({ error: 'NOT_OWNER' }, { status: 403 });
    }

    // ── Guard 2: active subscription ──────────────────────────────
    const activeSub = await Subscription.findOne({
      toolId: tool._id,
      status: { $in: ['active', 'paused'] },
    })
      .select('subscriptionId status nextBillingDate')
      .lean();
    if (activeSub) {
      return NextResponse.json(
        {
          error: 'ACTIVE_SUBSCRIPTION',
          subscriptionId: activeSub.subscriptionId,
          nextBillingDate: activeSub.nextBillingDate ?? null,
        },
        { status: 409 },
      );
    }

    // ── Guard 3: active boost ────────────────────────────────────
    const now = new Date();
    const slots: Array<'category-top' | 'home-rotation' | 'featured-badge'> = [
      'category-top',
      'home-rotation',
      'featured-badge',
    ];
    let earliestBoostExpiresAt: Date | null = null;
    for (const slot of slots) {
      const exp = tool.boostExpiresAt?.[slot];
      if (exp && new Date(exp) > now) {
        if (!earliestBoostExpiresAt || exp < earliestBoostExpiresAt) {
          earliestBoostExpiresAt = exp;
        }
      }
    }
    let confirmForfeitBoost = false;
    try {
      const body = await req.json().catch(() => ({}));
      confirmForfeitBoost = body?.confirmForfeitBoost === true;
    } catch {
      /* no body — defaults to false */
    }
    if (earliestBoostExpiresAt && !confirmForfeitBoost) {
      return NextResponse.json(
        {
          error: 'BOOST_FORFEIT_NOT_CONFIRMED',
          earliestBoostExpiresAt: earliestBoostExpiresAt.toISOString(),
        },
        { status: 409 },
      );
    }

    // ── Soft-delete + cleanup ────────────────────────────────────
    // Best-effort gateway cleanup for any initialized PayPal sub.
    // APPROVAL_PENDING subs on PayPal cannot be cancelled via the
    // cancel API — swallow those errors; PayPal expires them
    // server-side anyway.
    const orphanSubs = await Subscription.find({
      toolId: tool._id,
      userId: tool.ownerUserId ?? auth.userId,
      status: { $in: ['initialized', 'paused', 'failed'] },
    });
    for (const s of orphanSubs) {
      if (s.provider === 'paypal' && s.paypalSubscriptionId) {
        try {
          await cancelPayPalSubscription(
            s.paypalSubscriptionId,
            'Tool deleted by owner',
          );
        } catch (err) {
          if (err instanceof PayPalError) {
            console.log('[tools/delete] paypal cancel skipped', {
              subscriptionId: s.subscriptionId,
              httpStatus: err.httpStatus,
              paypalCode: err.paypalCode,
            });
          } else {
            console.warn('[tools/delete] paypal cancel error', err);
          }
        }
      }
    }
    await Subscription.updateMany(
      {
        toolId: tool._id,
        userId: tool.ownerUserId ?? auth.userId,
        status: { $in: ['initialized', 'paused', 'failed'] },
      },
      { $set: { status: 'cancelled', cancelledAt: new Date() } },
    );

    await Payment.updateMany(
      { toolId: tool._id, userId: tool.ownerUserId ?? auth.userId, status: 'pending' },
      { $set: { status: 'dropped' } },
    );

    tool.deletedAt = now;
    tool.deletedBy = auth.userId;
    tool.deletionSource = isAdmin && tool.ownerUserId !== auth.userId ? 'admin' : 'user';
    await tool.save();
    console.log('[tools/delete] soft-deleted', {
      id: String(tool._id),
      slug: tool.slug,
      by: auth.userId,
      source: tool.deletionSource,
      forfeitedBoost: !!earliestBoostExpiresAt,
    });

    // Cache-bust every public surface that might surface this tool.
    const pathsToRevalidate: string[] = [
      '/',
      '/ai-tools',
      `/ai-tools/${tool.slug}`,
      '/trending',
      '/latest-launches',
      '/top-products',
      '/upcoming',
      '/recently-added',
      '/dashboard',
    ];
    if (tool.category) {
      const cat = await Category.findOne({ name: tool.category })
        .select('slug')
        .lean();
      if (cat?.slug) pathsToRevalidate.push(`/category/${cat.slug}`);
    }
    for (const p of pathsToRevalidate) {
      try {
        revalidatePath(p);
      } catch (e) {
        console.warn('[tools/delete] revalidatePath failed', p, e);
      }
    }

    return NextResponse.json({
      ok: true,
      id: String(tool._id),
      deletedAt: tool.deletedAt,
      forfeitedBoost: !!earliestBoostExpiresAt,
    });
  } catch (err) {
    console.error('tools/[id] DELETE error:', err);
    return errorResponse('Failed to delete tool', 500);
  }
}

