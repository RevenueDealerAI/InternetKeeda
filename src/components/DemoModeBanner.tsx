"use client";

import { isDemoMode, DEMO_MODE_MESSAGE } from '@/lib/demo-mode';
import { AlertTriangle } from 'lucide-react';

export function DemoModeBanner() {
    if (!isDemoMode()) {
        return null;
    }

    return (
        <div className="bg-amber-500/90 text-black px-4 py-2.5 flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium text-sm">{DEMO_MODE_MESSAGE}</span>
        </div>
    );
}
