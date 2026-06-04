/**
 * PATCH  /api/store/admin/products/[id]  — partial update (admin)
 * DELETE /api/store/admin/products/[id]  — archive (admin)
 *
 * DELETE soft-archives by flipping status to 'archived' so existing
 * purchases keep their entitlement / download history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/app/api/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { StoreProduct } from '@/features/store/models/StoreProduct';

const patchSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().min(20).optional(),
  shortDescription: z.string().max(280).optional(),
  category: z
    .enum(['n8n-workflow', 'automation-pack', 'template', 'guide', 'other'])
    .optional(),
  tags: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  coverImageUrl: z.string().url().or(z.literal('')).optional(),
  previewImages: z.array(z.string().url()).optional(),
  filePath: z.string().url().optional(),
  fileName: z.string().min(1).optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  priceUsdMinor: z.number().int().nonnegative().optional(),
  priceInrMinor: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const a = await requireAdmin();
  if (a.kind !== 'ok') {
    return NextResponse.json(
      { error: a.kind },
      { status: a.kind === 'unauthenticated' ? 401 : 403 }
    );
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await req.json());
    await connectDB();
    const doc = await StoreProduct.findByIdAndUpdate(id, body, { new: true });
    if (!doc) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    return NextResponse.json({ data: doc });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'validation', details: err.errors },
        { status: 400 }
      );
    }
    console.error('[store/admin/products PATCH]', err);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const a = await requireAdmin();
  if (a.kind !== 'ok') {
    return NextResponse.json(
      { error: a.kind },
      { status: a.kind === 'unauthenticated' ? 401 : 403 }
    );
  }
  const { id } = await params;
  await connectDB();
  const doc = await StoreProduct.findByIdAndUpdate(
    id,
    { status: 'archived' },
    { new: true }
  );
  if (!doc) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json({ data: doc });
}
