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
        const faviconFile = formData.get('favicon') as File;
        
        if (!faviconFile) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }
        
        if (!validateImageType(faviconFile)) {
            return NextResponse.json({ 
                error: 'Invalid file type. Only JPEG, PNG, GIF, and SVG files are allowed.'
            }, { status: 400 });
        }
        
        const faviconUrl = await handleFileUpload(faviconFile, 'favicon');
        
        let config = await SiteConfig.findOne();
        if (!config) {
            config = await SiteConfig.create({});
        }
        
        config.favicon = faviconUrl;
        config.updatedAt = new Date();
        await config.save();
        
        return NextResponse.json({ 
            success: true, 
            faviconUrl: config.favicon
        });
    } catch (error: unknown) {
        console.error('Error uploading favicon:', error);
        return errorResponse('Failed to upload favicon', 500);
    }
}

