import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { errorResponse } from '../lib/auth';
import { Sponsorship } from '../models/Sponsorship';
import { Tool } from '../models/Tool';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        const sponsorships = await Sponsorship.find()
            .populate('toolId', '_id name logo description slug category tags features pricing status views votes rating reviews createdAt updatedAt isTrending isNew')
            .sort({ createdAt: -1 });
        
        return NextResponse.json(sponsorships);
    } catch (error: unknown) {
        console.error("Failed to fetch sponsorships with populated toolId:", error);
        return errorResponse('Failed to fetch sponsorships', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        
        const body = await req.json();
        const tool = await Tool.findById(body.toolId);
        
        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }
        
        if (!mongoose.Types.ObjectId.isValid(body.toolId)) {
            return NextResponse.json({ error: 'Invalid Tool ID provided for sponsorship' }, { status: 400 });
        }

        const sponsorshipData = { ...body };
        if (!sponsorshipData.name && tool) sponsorshipData.name = tool.name;
        if (!sponsorshipData.description && tool) sponsorshipData.description = tool.description;
        if (!sponsorshipData.logo && tool) sponsorshipData.logo = tool.logo;
        if (!sponsorshipData.slug && tool) sponsorshipData.slug = tool.slug;
        if (!sponsorshipData.category && tool) sponsorshipData.category = tool.category;
        if (!sponsorshipData.url && tool) sponsorshipData.url = tool.websiteUrl;

        const sponsorship = new Sponsorship(sponsorshipData);
        await sponsorship.save();
        
        const populatedSponsorship = await Sponsorship.findById(sponsorship._id)
            .populate('toolId', '_id name logo description slug category tags features pricing status views votes rating reviews createdAt updatedAt isTrending isNew');
        
        return NextResponse.json(populatedSponsorship, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating sponsorship:", error);
        return NextResponse.json({ 
            error: 'Failed to create sponsorship', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 400 });
    }
}

