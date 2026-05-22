'use client';

import PaymentsAdminPage from '@/themes/theme-one/pages/admin/payments/PaymentsAdminPage';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminProtectedRoute } from '@/components/admin/auth/AdminProtectedRoute';
import { useTheme } from '@/themes/ThemeContext';

export default function AdminPaymentsRoute() {
  const { isLoading } = useTheme();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-gray-900" />
      </div>
    );
  }
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <PaymentsAdminPage />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
