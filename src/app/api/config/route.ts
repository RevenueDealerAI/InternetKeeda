import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { errorResponse } from '../lib/auth';
import { requireAdmin } from '@/lib/auth/admin';
import { SiteConfig } from '../models/SiteConfig';
import mongoose from 'mongoose';

let configCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
    try {
        const now = Date.now();
        if (configCache && (now - configCache.timestamp) < CACHE_TTL) {
            return NextResponse.json(configCache.data, {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                    'X-Cache': 'HIT'
                }
            });
        }

        await connectDB();

        let config = await SiteConfig.findOne().lean();
        if (!config) {
            const defaultConfig = {
                siteName: 'Internet Keeda',
                siteDescription: 'A hand-curated directory of the best AI tools, updated daily.',
                logo: '',
                logoLight: '',
                logoDark: '',
                favicon: '/favicon.ico',
                primaryColor: '#DC2626',
                secondaryColor: '#0F172A',
                allowUserRegistration: true,
                allowUserSubmissions: true,
                requireApprovalForSubmissions: true,
                requireApprovalForReviews: true,
                footerText: `© ${new Date().getFullYear()} Internet Keeda. All rights reserved.`,
                contactEmail: '',
                socialLinks: {
                    twitter: '',
                    facebook: '',
                    instagram: '',
                    linkedin: '',
                    github: ''
                },
                analyticsId: '',
                customCss: '',
                customJs: '',
                adsenseEnabled: false,
                adsensePublisherId: '',
                adsenseAutoAds: true,
                adsenseAdUnits: [],
                metaTags: {
                    title: 'Internet Keeda — Discover the Best AI Tools',
                    description: 'A hand-curated directory of the best AI tools for builders, marketers, and creators. Updated daily.',
                    keywords: 'AI tools directory, best AI tools, AI software, AI for productivity, AI for creators',
                    ogImage: '/og-image.svg'
                },
                defaultTheme: 'system',
                allowThemeToggle: true,
                activeTheme: 'theme-one'
            };
            const created = await SiteConfig.create(defaultConfig);
            config = created.toObject();
        }

        configCache = {
            data: config,
            timestamp: now
        };

        return NextResponse.json(config, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                'X-Cache': 'MISS'
            }
        });
    } catch (error: unknown) {
        console.error('Error fetching site config:', error);
        if (configCache) {
            return NextResponse.json(configCache.data, {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                    'X-Cache': 'STALE'
                }
            });
        }
        return errorResponse('Failed to fetch site configuration', 500);
    }
}

export async function PUT(req: NextRequest) {
    try {
        const a = await requireAdmin();
        if (a.kind !== 'ok') {
            return NextResponse.json(
                { error: a.kind },
                { status: a.kind === 'unauthenticated' ? 401 : 403 },
            );
        }
        await connectDB();

        let config = await SiteConfig.findOne();
        if (!config) {
            config = await SiteConfig.create({});
        }

        const body = await req.json();
        const updateData = {
            ...body,
            updatedAt: new Date()
        };

        if (body.metaTags) {
            updateData.metaTags = {
                ...(config.metaTags || {}),
                ...body.metaTags
            };
        }

        if (body.socialLinks) {
            updateData.socialLinks = {
                ...(config.socialLinks || {}),
                ...body.socialLinks
            };
        }

        if (body.adsensePublisherId && !body.adsensePublisherId.match(/^ca-pub-[0-9]{10,16}$/)) {
            return NextResponse.json({
                error: 'Invalid AdSense Publisher ID format. Must be in format: ca-pub-XXXXXXXXXX'
            }, { status: 400 });
        }

        await mongoose.model('SiteConfig').updateOne(
            { _id: config._id },
            { $set: updateData },
            { upsert: true }
        );

        // Invalidate cache after update
        configCache = null;

        const updatedConfig = await SiteConfig.findById(config._id).lean();

        configCache = {
            data: updatedConfig,
            timestamp: Date.now()
        };

        return NextResponse.json(updatedConfig);
    } catch (error: unknown) {
        console.error('Error updating site config:', error);
        return errorResponse('Failed to update site configuration', 500);
    }
}

