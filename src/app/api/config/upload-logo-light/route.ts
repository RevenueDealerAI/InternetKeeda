import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { requireAdmin } from '@/lib/auth/admin';
import { SiteConfig } from '../../models/SiteConfig';
import { handleFileUpload, validateImageType } from '../../lib/fileUpload';

export async function POST(req: NextRequest) {
    try {
        const a = await requireAdmin();
        if (a.kind !== 'ok') {
            return NextResponse.json(
                { error: a.kind },
                { status: a.kind === 'unauthenticated' ? 401 : 403 },
            );
        }
        await connectDB();
        
        const formData = await req.formData();
        const logoFile = formData.get('logo') as File;
        
        if (!logoFile) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }
        
        if (!validateImageType(logoFile)) {
            return NextResponse.json({ 
                error: 'Invalid file type. Only JPEG and PNG files are allowed.'
            }, { status: 400 });
        }
        
        const logoUrl = await handleFileUpload(logoFile, 'logo');
        
        let config = await SiteConfig.findOne();
        if (!config) {
            config = await SiteConfig.create({});
        }
        
        config.logoLight = logoUrl;
        config.updatedAt = new Date();
        await config.save();
        
        return NextResponse.json({ 
            success: true, 
            logoUrl: config.logoLight
        });
    } catch (error: unknown) {
        console.error('Error uploading light mode logo:', error);
        return errorResponse('Failed to upload light mode logo', 500);
    }
}

