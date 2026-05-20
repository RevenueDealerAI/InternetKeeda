import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth } from '../lib/auth';
import { Category } from '../models/Category';
import { Tool } from '../models/Tool';
import { TOOL_CATEGORIES } from '@/lib/schemas/tool.schema';

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET - Fetch all categories
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const includeToolCount = searchParams.get('includeToolCount') === 'true';

    const query: { isActive?: boolean } = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    const categories = await Category.find(query).sort({ name: 1 });

    // Get tool counts for each category if needed
    let countMap = new Map<string, number>();
    if (includeToolCount) {
      const toolCounts = await Tool.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);

      countMap = new Map(toolCounts.map((item: { _id: string; count: number }) => [item._id, item.count]));

      categories.forEach(cat => {
        const count = countMap.get(cat.name) || 0;
        (cat as unknown as { toolCount: number }).toolCount = count;
      });
    }

    // Merge with static categories
    const staticCategories = TOOL_CATEGORIES.map(name => {
      const existingCategory = categories.find(cat => cat.name === name);
      if (existingCategory) {
        return {
          ...existingCategory.toObject(),
          toolCount: includeToolCount ? (countMap.get(name) || 0) : undefined
        };
      }
      // Return static category structure
      return {
        name,
        slug: generateSlug(name),
        isDefault: true,
        isActive: true,
        toolCount: includeToolCount ? (countMap.get(name) || 0) : undefined
      };
    });

    // Combine: static categories first, then custom categories
    const allCategories = [
      ...staticCategories,
      ...categories.filter(cat => !TOOL_CATEGORIES.includes(cat.name as typeof TOOL_CATEGORIES[number])).map(cat => cat.toObject())
    ];

    return NextResponse.json({
      success: true,
      data: allCategories,
      static: staticCategories,
      custom: categories.filter(cat => !TOOL_CATEGORIES.includes(cat.name as typeof TOOL_CATEGORIES[number])).map(cat => cat.toObject())
    }, {
      // Category list + tool counts change slowly. 5 minutes of CDN
      // freshness is fine; SWR for an hour lets the cache absorb spikes.
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth(req);

    const body = await req.json();
    const { name, description, icon, color } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      $or: [
        { name: name.trim() },
        { slug: generateSlug(name) }
      ]
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category already exists' },
        { status: 409 }
      );
    }

    // Check if it's a static category
    const isDefault = TOOL_CATEGORIES.includes(name.trim() as typeof TOOL_CATEGORIES[number]);

    const category = await Category.create({
      name: name.trim(),
      slug: generateSlug(name),
      description: description?.trim(),
      icon,
      color,
      isDefault,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      data: category
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { success: false, error: 'Category already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

