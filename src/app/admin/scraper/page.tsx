'use client';

import { useTheme } from '@/themes/ThemeContext';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import AutoScraperPage from '@/themes/theme-two/pages/admin/scraper/AutoScraperPage';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminProtectedRoute } from '@/components/admin/auth/AdminProtectedRoute';

export default function AdminScraperPage() {
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

    // We are using the same page for both themes for now as theme-one doesn't have a specific implementation yet
    // If needed, we can create a theme-one version later.

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <AutoScraperPage />
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
