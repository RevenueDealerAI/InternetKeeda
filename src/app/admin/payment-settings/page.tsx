'use client';

import { useTheme } from '@/themes/ThemeContext';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import PaymentSettingsPage from '@/themes/theme-one/pages/admin/settings/PaymentSettingsPage';
import ThemeTwoPaymentSettingsPage from '@/themes/theme-two/pages/admin/settings/PaymentSettingsPage';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminProtectedRoute } from '@/components/admin/auth/AdminProtectedRoute';

export default function AdminPaymentSettingsPage() {
  const { currentTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        {shouldShowThemeOne ? <PaymentSettingsPage /> : <ThemeTwoPaymentSettingsPage />}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}





