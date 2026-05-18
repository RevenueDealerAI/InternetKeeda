import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, errorResponse } from '../lib/auth';
import { AdvertisingPlan } from '../models/AdvertisingPlan';
import { z } from 'zod';

const advertisingPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be non-negative"),
  currency: z.enum(['USD', 'EUR', 'GBP']).optional().default('USD'),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  features: z.array(z.string().min(1)).min(1, "At least one feature is required"),
  isActive: z.boolean().optional().default(true),
  isPopular: z.boolean().optional().default(false),
  stripePriceId: z.string().optional(),
  paypalPlanId: z.string().optional(),
  placement: z.enum(['basic', 'featured', 'premium', 'sponsored']).optional().default('basic'),
  maxListings: z.number().min(1).optional().default(1),
  analytics: z.boolean().optional().default(false),
  socialPromotion: z.boolean().optional().default(false),
  newsletterFeature: z.boolean().optional().default(false),
  prioritySupport: z.boolean().optional().default(false),
  customIntegrations: z.boolean().optional().default(false)
});

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        const searchParams = req.nextUrl.searchParams;
        const active = searchParams.get('active');
        const filter = active === 'true' ? { isActive: true } : {};
        
        const plans = await AdvertisingPlan.find(filter).sort({ price: 1 });
        
        return NextResponse.json(plans);
    } catch (error: unknown) {
        console.error('Error fetching advertising plans:', error);
        return errorResponse('Failed to fetch advertising plans', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        await requireAuth();
        
        const body = await req.json();
        const validatedData = advertisingPlanSchema.parse(body);
        
        const existingPlan = await AdvertisingPlan.findOne({ slug: validatedData.slug });
        if (existingPlan) {
            return NextResponse.json({ error: 'A plan with this slug already exists' }, { status: 409 });
        }

        const plan = await AdvertisingPlan.create(validatedData);
        
        return NextResponse.json({
            success: true,
            message: 'Advertising plan created successfully',
            data: plan
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating advertising plan:', error);
        
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            
            return NextResponse.json({ 
                success: false,
                error: 'Validation failed',
                details: formattedErrors
            }, { status: 400 });
        }
        
        return NextResponse.json({ 
            success: false,
            error: 'Failed to create advertising plan' 
        }, { status: 500 });
    }
}

