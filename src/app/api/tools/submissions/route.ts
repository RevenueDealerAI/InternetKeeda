import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { Tool } from '../../models/Tool';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const submissions = await Tool.find({ status: 'pending' }).sort({ createdAt: -1 });

        const formattedSubmissions = submissions.map(submission => {
            const doc = submission.toObject();
            return {
                ...doc,
                _id: submission._id.toString(),
                id: submission._id.toString(),
                toolName: submission.name,
                logoUrl: submission.logo,
                createdAt: submission.createdAt,
                updatedAt: submission.updatedAt,
                submittedDate: submission.createdAt ? new Date(submission.createdAt).toISOString() : null
            };
        });

        return NextResponse.json(formattedSubmissions);
    } catch (error: unknown) {
        console.error('Error fetching tool submissions:', error);
        return errorResponse('Failed to fetch tool submissions', 500);
    }
}

