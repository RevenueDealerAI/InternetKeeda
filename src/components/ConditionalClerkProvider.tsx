'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useState, useEffect, ReactNode } from 'react';

interface ConditionalClerkProviderProps {
    children: ReactNode;
    publishableKey: string;
}

/**
 * ConditionalClerkProvider - Wraps ClerkProvider but only activates it
 * when NOT in an iframe. This prevents redirect loops in Envato preview.
 */
export function ConditionalClerkProvider({ children, publishableKey }: ConditionalClerkProviderProps) {
    const [isInIframe, setIsInIframe] = useState<boolean | null>(null);

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

    // While we're determining if we're in an iframe, show a loading state
    // to prevent flash of content or premature Clerk initialization
    if (isInIframe === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
            </div>
        );
    }

    // If in iframe, render without ClerkProvider to avoid redirect loops
    if (isInIframe) {
        return <>{children}</>;
    }

    // Fallback placeholder key so the SDK can initialise in local dev when
    // no .env.local key is provided. It decodes to "clerk.example.com$" — the
    // SDK won't reach a real backend, but useUser/useClerk return signed-out
    // defaults instead of throwing "useUser can only be used within ClerkProvider".
    const PLACEHOLDER_KEY = 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k';
    const keyToUse = publishableKey || PLACEHOLDER_KEY;

    // Normal case: render with ClerkProvider
    return (
        <ClerkProvider publishableKey={keyToUse}>
            {children}
        </ClerkProvider>
    );
}

export default ConditionalClerkProvider;
