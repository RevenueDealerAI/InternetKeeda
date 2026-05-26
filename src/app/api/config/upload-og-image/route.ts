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
        const ogImageFile = formData.get('ogImage') as File;
        
        if (!ogImageFile) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }
        
        if (!validateImageType(ogImageFile)) {
            return NextResponse.json({ 
                error: 'Invalid file type. Only JPEG and PNG files are allowed.'
            }, { status: 400 });
        }
        
        const ogImageUrl = await handleFileUpload(ogImageFile, 'og-image');
        
        let config = await SiteConfig.findOne();
        if (!config) {
            config = await SiteConfig.create({});
        }
        
        if (!config.metaTags) {
            config.metaTags = {};
        }
        
        config.metaTags.ogImage = ogImageUrl;
        config.updatedAt = new Date();
        await config.save();
        
        return NextResponse.json({ 
            success: true, 
            ogImageUrl: config.metaTags.ogImage
        });
    } catch (error: unknown) {
        console.error('Error uploading OG image:', error);
        return errorResponse('Failed to upload OG image', 500);
    }
}

