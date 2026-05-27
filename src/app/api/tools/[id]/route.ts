import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { requireUser } from '@/lib/auth/user';
import { formatTool } from '../../lib/formatTool';
import { Tool } from '../../models/Tool';
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
 * Owner-scoped soft-delete for tools the user hasn't yet paid for.
 * Gates:
 *   - signed-in (requireUser)
 *   - id resolves to an ObjectId-keyed tool (no slug shortcut; admin
 *     DELETE at /api/admin/tools/[id] handles edge cases)
 *   - ownerUserId === auth.userId
 *   - listingStatus is NOT paid-active (currently-paying tools must
 *     be cancelled via the subscription cancel flow first — prevents
 *     refund gaming by deleting a tool that's mid-billing)
 *   - listingStatus is NOT free-seeded (those are seeded directory
 *     rows the user doesn't own anyway)
 *
 * Side effects:
 *   - Mongo Tool: deletedAt = now, status preserved so admin can audit
 *   - Any Subscription in {initialized, paused, failed} for this
 *     toolId+userId is flipped to cancelled (PayPal subs also get a
 *     best-effort cancelSubscription API call — APPROVAL_PENDING
 *     subs that error are silently ignored since they'll expire)
 *   - Any pending Payment rows are flipped to dropped so they don't
 *     leak into admin pending-payments view
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
    if (tool.ownerUserId !== auth.userId) {
      return NextResponse.json({ error: 'Not your tool' }, { status: 403 });
    }
    if (tool.listingStatus === 'paid-active') {
      return NextResponse.json(
        {
          error:
            'Cancel your subscription first before deleting a tool that is currently live.',
        },
        { status: 409 },
      );
    }
    if (tool.listingStatus === 'free-seeded') {
      return NextResponse.json(
        { error: 'Seeded directory tools cannot be deleted by users.' },
        { status: 403 },
      );
    }

    // Best-effort gateway cleanup for any initialized PayPal sub
    // before we mark the local row cancelled. APPROVAL_PENDING subs
    // on PayPal cannot be cancelled via the cancel API — swallow
    // those errors; PayPal expires them server-side anyway.
    const orphanSubs = await Subscription.find({
      toolId: tool._id,
      userId: auth.userId,
      status: { $in: ['initialized', 'paused', 'failed'] },
    });
    for (const s of orphanSubs) {
      if (s.provider === 'paypal' && s.paypalSubscriptionId) {
        try {
          await cancelPayPalSubscription(
            s.paypalSubscriptionId,
            'Tool deleted by owner before activation',
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
        userId: auth.userId,
        status: { $in: ['initialized', 'paused', 'failed'] },
      },
      { $set: { status: 'cancelled', cancelledAt: new Date() } },
    );

    // Pending boost payment rows for this tool flip to dropped so
    // they don't loiter in admin pending-payments. Successful /
    // refunded rows stay untouched (audit trail).
    await Payment.updateMany(
      { toolId: tool._id, userId: auth.userId, status: 'pending' },
      { $set: { status: 'dropped' } },
    );

    tool.deletedAt = new Date();
    await tool.save();

    return NextResponse.json({
      ok: true,
      id: String(tool._id),
      deletedAt: tool.deletedAt,
    });
  } catch (err) {
    console.error('tools/[id] DELETE error:', err);
    return errorResponse('Failed to delete tool', 500);
  }
}

