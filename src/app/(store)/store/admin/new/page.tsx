import { requireStoreAdmin } from '@/features/store/components/admin/AdminGuard';
import AdminProductForm from '@/features/store/components/admin/AdminProductForm';

export const dynamic = 'force-dynamic';

export default async function NewStoreProductPage() {
  await requireStoreAdmin();
  return (
    <AdminProductForm
      mode="create"
      initial={{
        title: '',
        slug: '',
        description: '',
        shortDescription: '',
        category: 'n8n-workflow',
        tags: [],
        includes: [],
        coverImageUrl: '',
        filePath: '',
        fileName: '',
        fileSizeBytes: 0,
        priceUsdMinor: 0,
        priceInrMinor: 0,
        status: 'draft',
      }}
    />
  );
}
