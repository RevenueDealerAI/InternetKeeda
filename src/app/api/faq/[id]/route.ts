import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { FAQ } from '../../models/FAQ';
import { z } from 'zod';
import mongoose from 'mongoose';

const faqUpdateSchema = z.object({
    question: z.string().min(2).optional(),
    answer: z.string().min(10).optional(),
    category: z.string().min(1).optional(),
    order: z.number().optional(),
    isActive: z.boolean().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid FAQ ID' }, { status: 400 });
        }

        const faq = await FAQ.findById(id);

        if (!faq) {
            return NextResponse.json({ success: false, error: 'FAQ not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                _id: faq._id.toString(),
                id: faq._id.toString(),
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                order: faq.order,
                isActive: faq.isActive,
                createdAt: faq.createdAt,
                updatedAt: faq.updatedAt,
            }
        });
    } catch (error: unknown) {
        console.error('Error fetching FAQ:', error);
        return errorResponse('Failed to fetch FAQ', 500);
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
        const updateData = faqUpdateSchema.parse(body);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid FAQ ID' }, { status: 400 });
        }

        const faq = await FAQ.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!faq) {
            return NextResponse.json({ success: false, error: 'FAQ not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                _id: faq._id.toString(),
                id: faq._id.toString(),
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                order: faq.order,
                isActive: faq.isActive,
                createdAt: faq.createdAt,
                updatedAt: faq.updatedAt,
            }
        });
    } catch (error: unknown) {
        console.error('Error updating FAQ:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to update FAQ', 500);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        await requireAuth();
        
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid FAQ ID' }, { status: 400 });
        }

        const faq = await FAQ.findByIdAndDelete(id);

        if (!faq) {
            return NextResponse.json({ success: false, error: 'FAQ not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error deleting FAQ:', error);
        return errorResponse('Failed to delete FAQ', 500);
    }
}




