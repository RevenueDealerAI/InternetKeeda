/**
 * GET  /api/store/admin/products      — list (admin only)
 * POST /api/store/admin/products      — create (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/app/api/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { StoreProduct } from '@/features/store/models/StoreProduct';

const createSchema = z.object({
  title: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters / digits / hyphens'),
  description: z.string().min(20),
  shortDescription: z.string().max(280).optional().default(''),
  category: z.enum([
    'n8n-workflow',
    'automation-pack',
    'template',
    'guide',
    'other',
  ]),
  tags: z.array(z.string()).default([]),
  includes: z.array(z.string()).default([]),
  coverImageUrl: z.string().url().or(z.literal('')).default(''),
  previewImages: z.array(z.string().url()).default([]),
  filePath: z.string().url('filePath must be a Vercel Blob URL'),
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative().default(0),
  priceUsdMinor: z.number().int().nonnegative(),
  priceInrMinor: z.number().int().nonnegative(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export async function GET() {
  const a = await requireAdmin();
  if (a.kind !== 'ok') {
    return NextResponse.json(
      { error: a.kind },
      { status: a.kind === 'unauthenticated' ? 401 : 403 }
    );
  }
  await connectDB();
  const items = await StoreProduct.find({})
    .sort({ createdAt: -1 })
    .select(
      'title slug status category priceUsdMinor priceInrMinor salesCount coverImageUrl createdAt'
    )
    .lean();
  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const a = await requireAdmin();
  if (a.kind !== 'ok') {
    return NextResponse.json(
      { error: a.kind },
      { status: a.kind === 'unauthenticated' ? 401 : 403 }
    );
  }
  try {
    const body = createSchema.parse(await req.json());
    await connectDB();
    const existing = await StoreProduct.findOne({ slug: body.slug })
      .select('_id')
      .lean();
    if (existing) {
      return NextResponse.json({ error: 'slug-taken' }, { status: 409 });
    }
    const doc = await StoreProduct.create({
      ...body,
      createdBy: a.userId,
    });
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'validation', details: err.errors },
        { status: 400 }
      );
    }
    console.error('[store/admin/products POST]', err);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
