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
    // Optional limit — surfaces that only need the top-N (nav dropdown,
    // home bento) ask for limit=30 instead of 678. Drops the payload from
    // ~227 KB to ~12 KB.
    const limitParam = parseInt(searchParams.get('limit') || '0', 10);
    const limit = isFinite(limitParam) && limitParam > 0 ? limitParam : 0;

    const query: { isActive?: boolean } = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    // Source of truth: the `categories` collection in MongoDB.
    // Sort alphabetically — surfaces (submit form, moderation
    // dropdown, navbar list) all expect this order.
    //
    // Earlier this endpoint prepended a 19-item TOOL_CATEGORIES
    // placeholder list to the front of every response, in the
    // declaration order of that constant. The submit-tool dropdown
    // saw those 19 placeholders first, in unsorted order, with the
    // alphabetised 673 real DB rows pushed below the fold. The
    // user's "8 generic categories" report was exactly the visible
    // top of the prepended list. The prepend is gone — DB rows
    // only.
    const categories = await Category.find(query).sort({ name: 1 });

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

    let allCategories = categories.map(cat => cat.toObject());

    // When limit is requested AND tool counts are included, return the
    // top-N by toolCount instead of alpha-sorted by name. Useful for nav
    // dropdowns and home page surfaces that only render top categories.
    if (limit > 0) {
      if (includeToolCount) {
        allCategories = allCategories
          .slice()
          .sort((a, b) => (b.toolCount || 0) - (a.toolCount || 0))
          .slice(0, limit);
      } else {
        allCategories = allCategories.slice(0, limit);
      }
    }

    return NextResponse.json({
      success: true,
      data: allCategories,
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

