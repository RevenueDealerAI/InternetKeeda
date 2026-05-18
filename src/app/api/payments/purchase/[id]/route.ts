import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { requireAuth, errorResponse } from '../../../lib/auth';
import { AdvertisingPurchase } from '../../../models/AdvertisingPurchase';
import { z } from 'zod';

const updatePurchaseSchema = z.object({
  toolId: z.string().optional(),
  toolName: z.string().optional(),
  toolUrl: z.string().url().optional(),
  notes: z.string().optional()
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = await requireAuth(req);
    const { id } = await params;
    
    const purchase = await AdvertisingPurchase.findById(id);
    
    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Verify user owns this purchase
    if (purchase.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(purchase);
  } catch (error: unknown) {
    console.error('Error fetching purchase:', error);
    return errorResponse('Failed to fetch purchase', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = await requireAuth(req);
    const { id } = await params;
    
    const body = await req.json();
    const validatedData = updatePurchaseSchema.parse(body);
    
    const purchase = await AdvertisingPurchase.findById(id);
    
    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Verify user owns this purchase
    if (purchase.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Update purchase
    Object.assign(purchase, validatedData);
    await purchase.save();
    
    return NextResponse.json(purchase);
  } catch (error: unknown) {
    console.error('Error updating purchase:', error);
    
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formattedErrors
        },
        { status: 400 }
      );
    }
    
    return errorResponse('Failed to update purchase', 500);
  }
}





