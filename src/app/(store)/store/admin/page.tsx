import { requireStoreAdmin } from '@/features/store/components/admin/AdminGuard';
import AdminProductList from '@/features/store/components/admin/AdminProductList';

export const dynamic = 'force-dynamic';

export default async function StoreAdminPage() {
  await requireStoreAdmin();
  return <AdminProductList />;
}
