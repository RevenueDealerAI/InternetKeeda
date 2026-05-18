'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * IframeDetectionBanner - Detects if the site is loaded in an iframe (e.g., Envato preview)
 * and shows a banner with a link to open the site directly.
 */
export function IframeDetectionBanner() {
    const [isInIframe, setIsInIframe] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if we're inside an iframe
        try {
            const inIframe = window.self !== window.top;
            setIsInIframe(inIframe);
        } catch (e) {
            // If we can't access window.top due to cross-origin restrictions,
            // we're definitely in an iframe
            setIsInIframe(true);
        }
    }, []);

    // Don't render if not in iframe or if dismissed
    if (!isInIframe || isDismissed) {
        return null;
    }

    // Get the app URL from environment variable, fallback to current origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== 'undefined' ? window.location.origin : '');

    // Construct the full URL including the current path
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const fullUrl = `${appUrl}${currentPath}`;

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-[9999]",
            "bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600",
            "text-white shadow-lg"
        )}>
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
                            <ExternalLink className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm sm:text-base font-medium">
                                You're viewing this in preview mode. Some features may not work properly.
                            </p>
                            <p className="text-xs sm:text-sm text-white/80 hidden sm:block">
                                Open the full site for the complete experience.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "inline-flex items-center gap-2 px-4 py-2",
                                "bg-white text-purple-600 font-semibold text-sm",
                                "rounded-full hover:bg-purple-50 transition-colors",
                                "shadow-md hover:shadow-lg"
                            )}
                        >
                            <span className="hidden sm:inline">Open Full Site</span>
                            <span className="sm:hidden">Open</span>
                            <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                            onClick={() => setIsDismissed(true)}
                            className={cn(
                                "p-2 rounded-full hover:bg-white/20 transition-colors",
                                "text-white/80 hover:text-white"
                            )}
                            aria-label="Dismiss banner"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default IframeDetectionBanner;
