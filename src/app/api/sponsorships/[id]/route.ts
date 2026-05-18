import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { Sponsorship } from '../../models/Sponsorship';
import mongoose from 'mongoose';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid Sponsorship ID format' }, { status: 400 });
        }
        
        if (body.toolId && !mongoose.Types.ObjectId.isValid(body.toolId)) {
            return NextResponse.json({ error: 'Invalid Tool ID format for update' }, { status: 400 });
        }

        const sponsorship = await Sponsorship.findByIdAndUpdate(id, body, { new: true })
            .populate('toolId', '_id name logo description slug category tags features pricing status views votes rating reviews createdAt updatedAt isTrending isNew');
        
        if (!sponsorship) {
            return NextResponse.json({ error: 'Sponsorship not found' }, { status: 404 });
        }
        
        return NextResponse.json(sponsorship);
    } catch (error: unknown) {
        console.error("Error updating sponsorship:", error);
        return NextResponse.json({ 
            error: 'Failed to update sponsorship', 
            details: error instanceof Error ? error.message : String(error)
        }, { status: 400 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ 
                error: 'Invalid ID format', 
                details: 'The provided ID is not a valid MongoDB ObjectId' 
            }, { status: 400 });
        }
        
        const sponsorship = await Sponsorship.findByIdAndDelete(id);
        
        if (!sponsorship) {
            return NextResponse.json({ error: 'Sponsorship not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: 'Sponsorship deleted successfully' });
    } catch (error: unknown) {
        console.error("Error deleting sponsorship:", error);
        return NextResponse.json({ 
            error: 'Failed to delete sponsorship', 
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

