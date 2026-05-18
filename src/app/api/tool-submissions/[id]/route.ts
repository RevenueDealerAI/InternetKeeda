import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { ToolSubmission } from '../../models/ToolSubmission';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        await requireAuth();
        
        const { id } = await params;
        const submission = await ToolSubmission.findByIdAndDelete(id);

        if (!submission) {
            return NextResponse.json({ error: 'Tool submission not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Tool submission deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting tool submission:', error);
        return errorResponse('Failed to delete tool submission', 500);
    }
}

