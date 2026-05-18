import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { Tool } from '../../models/Tool';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get('search');

        const query: any = { status: 'published' };
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const tools = await Tool.find(query)
            .select('_id name description logo slug category votes websiteUrl') // Added websiteUrl as it's used in the form
            .sort({ name: 1 })
            .limit(100);

        return NextResponse.json(tools);
    } catch (error: unknown) {
        console.error('Error fetching available tools:', error);
        return errorResponse('Failed to fetch available tools', 500);
    }
}

