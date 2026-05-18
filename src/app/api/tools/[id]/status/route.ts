import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { requireAuth, errorResponse } from '../../../lib/auth';
import { Tool } from '../../../models/Tool';
import { z } from 'zod';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        await requireAuth();
        
        const { id } = await params;
        const body = await req.json();
        const { status } = z.object({
            status: z.enum(["draft", "published", "archived", "pending", "approved", "rejected"])
        }).parse(body);

        const finalStatus = status === 'approved' ? 'published' : status;

        const updatedTool = await Tool.findByIdAndUpdate(
            id,
            { status: finalStatus, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedTool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        return NextResponse.json(updatedTool);
    } catch (error: unknown) {
        console.error('Error updating tool status:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to update tool status', 500);
    }
}

