import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, getAuth, errorResponse } from '../../lib/auth';
import { SiteConfig } from '../../models/SiteConfig';
import { handleFileUpload, validateImageType } from '../../lib/fileUpload';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const auth = await requireAuth();
        
        const user = await getAuth();
        const isAdmin = (user?.publicMetadata as Record<string, unknown>)?.role === 'admin';
        const userEmail = user?.emailAddresses?.[0]?.emailAddress || '';
        const isAdminDomain = userEmail.endsWith('@internetkeeda.com');
        
        if (!isAdmin && !isAdminDomain) {
            return NextResponse.json({ 
                error: 'Not authorized to upload favicon'
            }, { status: 403 });
        }
        
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

