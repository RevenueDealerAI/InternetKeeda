import { requireStoreAdmin } from '@/features/store/components/admin/AdminGuard';
import AdminPurchasesList from '@/features/store/components/admin/AdminPurchasesList';

export const dynamic = 'force-dynamic';

export default async function StoreAdminPurchasesPage() {
  await requireStoreAdmin();
  return <AdminPurchasesList />;
}
