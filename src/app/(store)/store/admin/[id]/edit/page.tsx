import { notFound } from 'next/navigation';
import { connectDB } from '@/app/api/lib/db';
import { StoreProduct } from '@/features/store/models/StoreProduct';
import { requireStoreAdmin } from '@/features/store/components/admin/AdminGuard';
import AdminProductForm from '@/features/store/components/admin/AdminProductForm';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function EditStoreProductPage({ params }: RouteParams) {
  await requireStoreAdmin();
  const { id } = await params;
  await connectDB();
  const doc = await StoreProduct.findById(id).lean();
  if (!doc) notFound();

  return (
    <AdminProductForm
      mode="edit"
      initial={{
        _id: String(doc._id),
        title: doc.title,
        slug: doc.slug,
        description: doc.description,
        shortDescription: doc.shortDescription,
        category: doc.category,
        tags: doc.tags || [],
        includes: doc.includes || [],
        coverImageUrl: doc.coverImageUrl || '',
        filePath: doc.filePath,
        fileName: doc.fileName,
        fileSizeBytes: doc.fileSizeBytes || 0,
        priceUsdMinor: doc.priceUsdMinor,
        priceInrMinor: doc.priceInrMinor,
        status: doc.status,
      }}
    />
  );
}
