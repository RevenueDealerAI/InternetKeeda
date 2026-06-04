/**
 * POST /api/store/admin/upload
 *
 * Receives multipart/form-data with:
 *   - file:  the downloadable file (private)        — required for kind="file"
 *   - file:  the cover image (public)               — required for kind="cover"
 *   - kind:  "file" | "cover"
 *
 * Returns { url, fileName, sizeBytes } so the admin product form
 * can post the final URL back to /api/store/admin/products on save.
 *
 * Streams to Vercel Blob via the storage adapter. Admin-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import {
  uploadPrivateFile,
  uploadPublicCover,
} from '@/features/store/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cap at 50MB for now; bump if/when packs grow.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const a = await requireAdmin();
  if (a.kind !== 'ok') {
    return NextResponse.json(
      { error: a.kind },
      { status: a.kind === 'unauthenticated' ? 401 : 403 }
    );
  }
  try {
    const form = await req.formData();
    const kind = String(form.get('kind') || 'file');
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'file field is required' },
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'file is empty' }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'file exceeds 50MB cap' },
        { status: 413 }
      );
    }
    const result =
      kind === 'cover'
        ? await uploadPublicCover(file, file.name)
        : await uploadPrivateFile(file, file.name);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    console.error('[store/admin/upload]', err);
    const msg = err instanceof Error ? err.message : 'upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
