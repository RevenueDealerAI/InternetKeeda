import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { formatTool } from '../../lib/formatTool';
import { Tool } from '../../models/Tool';
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

// DELETE moved to /api/admin/tools/[id]/route.ts (admin-only soft
// delete, cancels active subscriptions). The previous handler here
// had two bugs: it used requireAuth (any signed-in user could
// delete) and called findByIdAndDelete(id) which threw a CastError
// when `id` was a slug. Removed entirely so no fallback path exists.

