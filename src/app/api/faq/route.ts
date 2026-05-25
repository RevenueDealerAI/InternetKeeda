import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, errorResponse } from '../lib/auth';
import { FAQ } from '../models/FAQ';
import { z } from 'zod';

const faqSchema = z.object({
    question: z.string().min(2, "Question must be at least 2 characters"),
    answer: z.string().min(10, "Answer must be at least 10 characters"),
    category: z.string().min(1, "Category is required"),
    order: z.number().default(0),
    isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const includeInactive = searchParams.get('includeInactive') === 'true';

        const query: { isActive?: boolean; category?: string } = {};

        if (!includeInactive) {
            query.isActive = true;
        }

        if (category) {
            query.category = category;
        }

        const faqs = await FAQ.find(query).sort({ category: 1, order: 1, createdAt: 1 }).lean();

        const groupedByCategory = faqs.reduce((acc, faq) => {
            const cat = faq.category;
            if (!acc[cat]) {
                acc[cat] = [];
            }
            acc[cat].push({
                _id: faq._id.toString(),
                id: faq._id.toString(),
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                order: faq.order,
                isActive: faq.isActive,
                createdAt: faq.createdAt,
                updatedAt: faq.updatedAt,
            });
            return acc;
        }, {} as Record<string, unknown[]>);

        return NextResponse.json(
            {
                success: true,
                data: faqs.map(faq => ({
                    _id: faq._id.toString(),
                    id: faq._id.toString(),
                    question: faq.question,
                    answer: faq.answer,
                    category: faq.category,
                    order: faq.order,
                    isActive: faq.isActive,
                    createdAt: faq.createdAt,
                    updatedAt: faq.updatedAt,
                })),
                grouped: groupedByCategory,
            },
            {
                headers: {
                    // FAQs are essentially static editorial content.
                    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=7200',
                },
            }
        );
    } catch (error: unknown) {
        console.error('Error fetching FAQs:', error);
        return errorResponse('Failed to fetch FAQs', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        await requireAuth();

        const body = await req.json();
        const validatedData = faqSchema.parse(body);

        const faq = await FAQ.create(validatedData);

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
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating FAQ:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to create FAQ', 500);
    }
}




