import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { errorResponse } from '../../../lib/auth';
import { Tool } from '../../../models/Tool';
import { z } from 'zod';
import mongoose from 'mongoose';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const searchParams = req.nextUrl.searchParams;
        const action = searchParams.get('action');

        const validatedAction = z.object({
            action: z.enum(["upvote", "downvote"])
        }).parse({ action });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid ID format for voting' }, { status: 400 });
        }

        const tool = await Tool.findById(id);
        
        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        if (validatedAction.action === "upvote") {
            tool.votes = (tool.votes || 0) + 1;
        } else if (validatedAction.action === "downvote") {
            tool.votes = Math.max(0, (tool.votes || 0) - 1);
        }

        await tool.save();

        return NextResponse.json({ 
            success: true, 
            votes: tool.votes 
        });
    } catch (error: unknown) {
        console.error('Error updating tool votes via GET:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to update votes', 500);
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const { action } = z.object({
            action: z.enum(["upvote", "downvote"])
        }).parse(body);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid ID format for voting' }, { status: 400 });
        }

        const tool = await Tool.findById(id);
        
        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        if (action === "upvote") {
            tool.votes = (tool.votes || 0) + 1;
        } else if (action === "downvote") {
            tool.votes = Math.max(0, (tool.votes || 0) - 1);
        }

        await tool.save();

        return NextResponse.json({ 
            success: true, 
            votes: tool.votes 
        });
    } catch (error: unknown) {
        console.error('Error updating tool votes (POST):', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to update votes', 500);
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const { action } = z.object({
            action: z.enum(["upvote", "downvote"])
        }).parse(body);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid ID format for voting' }, { status: 400 });
        }

        const tool = await Tool.findById(id);
        
        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        if (action === "upvote") {
            tool.votes = (tool.votes || 0) + 1;
        } else if (action === "downvote") {
            tool.votes = Math.max(0, (tool.votes || 0) - 1);
        }

        await tool.save();

        return NextResponse.json({ 
            success: true, 
            votes: tool.votes 
        });
    } catch (error: unknown) {
        console.error('Error updating tool votes (PATCH):', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to update votes', 500);
    }
}

