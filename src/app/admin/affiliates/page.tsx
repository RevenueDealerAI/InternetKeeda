'use client';

import { useTheme } from '@/themes/ThemeContext';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import AffiliatesPage from '@/themes/theme-one/pages/admin/affiliates/AffiliatesPage';
import ThemeTwoAffiliatesPage from '@/themes/theme-two/pages/admin/affiliates/AffiliatesPage';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminProtectedRoute } from '@/components/admin/auth/AdminProtectedRoute';

export default function AdminAffiliatesPage() {
    const { currentTheme, isLoading } = useTheme();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-gray-900" />
            </div>
        );
    }

    const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
    const shouldShowThemeOne = safeTheme.id === 'theme-one';

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                {shouldShowThemeOne ? <AffiliatesPage /> : <ThemeTwoAffiliatesPage />}
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
