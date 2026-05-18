import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, errorResponse } from '../lib/auth';
import { SalesInquiry } from '../models/SalesInquiry';
import { z } from 'zod';

const salesInquirySchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  companyName: z.string().min(1, "Company name is required"),
  monthlyBudget: z.string().min(1, "Please select a monthly budget"),
  message: z.string().min(10, "Message must be at least 10 characters"),
}).catchall(z.any());

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const inquiries = await SalesInquiry.find().sort({ submittedAt: -1 });
        return NextResponse.json(inquiries);
    } catch (error: unknown) {
        console.error('Error fetching sales inquiries:', error);
        return errorResponse('Failed to fetch sales inquiries', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        
        let formData = await req.json();
        
        if (formData && typeof formData === 'object' && Object.keys(formData).length === 1) {
            const firstKey = Object.keys(formData)[0];
            if (typeof formData[firstKey] === 'object' && formData[firstKey] !== null) {
                formData = formData[firstKey];
            }
        }

        const validatedData = salesInquirySchema.parse(formData);

        const inquiryData = {
            fullName: validatedData.fullName,
            email: validatedData.email,
            companyName: validatedData.companyName,
            monthlyBudget: validatedData.monthlyBudget,
            message: validatedData.message,
            status: 'new' as const,
            submittedAt: new Date(),
            updatedAt: new Date(),
        };

        const inquiry = await SalesInquiry.create(inquiryData);
        
        return NextResponse.json({
            success: true,
            message: "Your inquiry has been submitted successfully. We'll get back to you soon!",
            data: inquiry
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating sales inquiry:', error);
        
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            
            return NextResponse.json({ 
                success: false,
                error: 'Validation failed',
                details: formattedErrors,
                message: formattedErrors.map(e => e.message).join(', ')
            }, { status: 400 });
        }
        
        return NextResponse.json({ 
            success: false,
            error: 'Failed to create sales inquiry',
            message: 'An error occurred while processing your request'
        }, { status: 500 });
    }
}

