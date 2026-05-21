import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, unauthorizedResponse, errorResponse } from '../lib/auth';
import { formatTool } from '../lib/formatTool';
import { Tool } from '../models/Tool';
import { z } from 'zod';
import mongoose from 'mongoose';

const toolSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    websiteUrl: z.string().url("Please enter a valid URL"),
    category: z.string().min(1, "Please select a category"),
    tags: z.array(z.string()).min(1, "Add at least one tag"),
    pricing: z.object({
        type: z.enum(["free", "freemium", "paid", "enterprise"], {
            required_error: "Please select a pricing type",
        }),
        startingPrice: z.union([
            z.string().transform((val) => {
                const parsed = parseFloat(val);
                return isNaN(parsed) ? undefined : parsed;
            }),
            z.number(),
            z.undefined()
        ]),
    }),
    features: z.array(z.string()).min(1, "Add at least one feature"),
    logo: z.string().url("Invalid URL").optional().or(z.literal("")),
    status: z.enum(["draft", "published", "archived", "pending", "approved", "rejected"]).default("draft"),
    isTrending: z.boolean().optional(),
    isNew: z.boolean().optional(),
    isUpcoming: z.boolean().optional(),
    isTopRated: z.boolean().optional(),
    views: z.number().default(0),
    votes: z.number().default(0),
    rating: z.number().default(0),
    reviews: z.number().default(0),
    slug: z.string().optional(),
});

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get('search');
        const limit = searchParams.get('limit') || '50';
        const page = searchParams.get('page') || '1';
        const category = searchParams.get('category');
        const pricing = searchParams.get('pricing');
        const status = searchParams.get('status') || 'published';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const ids = searchParams.get('ids'); // Support fetching by IDs
        
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        type MongoQuery = {
            _id?: { $in: mongoose.Types.ObjectId[] };
            status?: string;
            category?: { $regex: string; $options: string };
            'pricing.type'?: string;
            $or?: Array<{ name?: RegExp; description?: RegExp; category?: RegExp; tags?: { $in: RegExp[] } }>;
        } & Record<string, unknown>;

        const query: MongoQuery = {};

        if (status) {
            query.status = status;
        } else {
            query.status = 'published';
        }

        // Visibility filter: never leak unpaid-pending / unpaid-hidden
        // tools on public surfaces. Seeded tools (free-seeded), active
        // paid listings, and tools that haven't been migrated yet
        // (listingStatus absent) all stay visible.
        query.listingStatus = { $nin: ['unpaid-pending', 'unpaid-hidden'] } as unknown as string;

        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        if (pricing) {
            query['pricing.type'] = pricing;
        }

        // If IDs are provided, fetch only those tools
        if (ids) {
            const idArray = ids.split(',').filter(id => id.trim());
            if (idArray.length > 0) {
                // Convert string IDs to ObjectIds for MongoDB query
                const objectIds = idArray
                    .filter(id => mongoose.Types.ObjectId.isValid(id))
                    .map(id => new mongoose.Types.ObjectId(id));
                
                if (objectIds.length > 0) {
                    query._id = { $in: objectIds };
                    // When fetching by IDs, don't filter by status
                    delete query.status;
                }
            }
        }

        interface SortOptions {
            [key: string]: 1 | -1;
        }

        const sortOptions: SortOptions = {};
        const validSortFields = ['createdAt', 'updatedAt', 'name', 'views', 'votes', 'rating'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            
            query.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { category: searchRegex },
                { tags: { $in: [searchRegex] } }
            ];
            
            const [tools, totalCount] = await Promise.all([
                Tool.find(query)
                    .sort({ 
                        name: 1,
                        views: -1,
                        createdAt: -1 
                    })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Tool.countDocuments(query)
            ]);
            
            const formattedTools = tools.map(formatTool);

            return NextResponse.json({
                data: formattedTools,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalCount,
                    limit: limitNum,
                    hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                    hasPrevPage: pageNum > 1
                }
            }, { headers: TOOLS_CACHE_HEADERS });
        }

        const [tools, totalCount] = await Promise.all([
            Tool.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Tool.countDocuments(query)
        ]);

        const formattedTools = tools.map(formatTool);

        return NextResponse.json({
            data: formattedTools,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalCount,
                limit: limitNum,
                hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                hasPrevPage: pageNum > 1
            }
        }, { headers: TOOLS_CACHE_HEADERS });
    } catch (error: unknown) {
        console.error('Error fetching tools:', error);
        return errorResponse('Failed to fetch tools', 500);
    }
}

// Vercel CDN caches the response for 60s, then serves stale while
// revalidating in the background for up to 10 min. Tool lists change
// editorially (new submissions, edits) — 60s of staleness is fine.
const TOOLS_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
} as const;

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const auth = await requireAuth();
        
        const body = await req.json();
        const toolData = toolSchema.parse(body);

        const slug = toolData.slug || generateSlug(toolData.name);

        const existingTool = await Tool.findOne({ slug });
        if (existingTool) {
            const randomSuffix = Math.floor(Math.random() * 1000);
            toolData.slug = `${slug}-${randomSuffix}`;
        } else {
            toolData.slug = slug;
        }

        const dbToolData = {
            ...toolData,
            isNewTool: toolData.isNew,
            status: 'pending'
        };

        const newTool = new Tool(dbToolData);
        await newTool.save();
        
        return NextResponse.json(newTool, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating tool:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to create tool', 500);
    }
}

