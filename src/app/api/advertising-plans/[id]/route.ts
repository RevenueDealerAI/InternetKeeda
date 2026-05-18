import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { AdvertisingPlan } from '../../models/AdvertisingPlan';
import { AdvertisingPurchase } from '../../models/AdvertisingPurchase';
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

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        
        const plan = await AdvertisingPlan.findById(id);
        
        if (!plan) {
            return NextResponse.json({ error: 'Advertising plan not found' }, { status: 404 });
        }
        
        return NextResponse.json(plan);
    } catch (error: unknown) {
        console.error('Error fetching advertising plan:', error);
        return errorResponse('Failed to fetch advertising plan', 500);
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
        const validatedData = advertisingPlanSchema.partial().parse(body);
        
        if (validatedData.slug) {
            const existingPlan = await AdvertisingPlan.findOne({ 
                slug: validatedData.slug, 
                _id: { $ne: id } 
            });
            if (existingPlan) {
                return NextResponse.json({ error: 'A plan with this slug already exists' }, { status: 409 });
            }
        }

        const plan = await AdvertisingPlan.findByIdAndUpdate(
            id,
            validatedData,
            { new: true, runValidators: true }
        );

        if (!plan) {
            return NextResponse.json({ error: 'Advertising plan not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Advertising plan updated successfully',
            data: plan
        });
    } catch (error: unknown) {
        console.error('Error updating advertising plan:', error);
        
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
            error: 'Failed to update advertising plan' 
        }, { status: 500 });
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
        
        const activePurchases = await AdvertisingPurchase.countDocuments({
            planId: id,
            status: 'active'
        });
        
        if (activePurchases > 0) {
            return NextResponse.json({ 
                error: 'Cannot delete plan with active purchases. Please wait for them to expire or cancel them first.' 
            }, { status: 400 });
        }

        const plan = await AdvertisingPlan.findByIdAndDelete(id);

        if (!plan) {
            return NextResponse.json({ error: 'Advertising plan not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Advertising plan deleted successfully'
        });
    } catch (error: unknown) {
        console.error('Error deleting advertising plan:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to delete advertising plan' 
        }, { status: 500 });
    }
}

