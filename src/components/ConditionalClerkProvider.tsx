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
 *
 * A previous experiment tried skipping ClerkProvider entirely on
 * "public" routes to defer the Clerk SDK download. Reverted because
 * every page renders Navigation which calls useUser() unconditionally;
 * useUser throws outside a ClerkProvider tree. Stubbing useUser
 * requires either a custom hook everywhere it's called (invasive) or
 * a React-context shim that mirrors Clerk's internals (fragile).
 * Easier mobile wins live elsewhere.
 */
export function ConditionalClerkProvider({ children, publishableKey }: ConditionalClerkProviderProps) {
    // Default to NOT-iframed (the 99% case). On client mount we detect
    // and re-render without ClerkProvider only if we actually ARE in
    // an iframe. Previously this state defaulted to `null` and returned
    // a spinner — which was both an LCP regression and broke static
    // prerender of admin pages because the children (including
    // useUser callers) never got a ClerkProvider in the SSR pass.
    const [isInIframe, setIsInIframe] = useState(false);

    useEffect(() => {
        try {
            setIsInIframe(window.self !== window.top);
        } catch {
            setIsInIframe(true);
        }
    }, []);

    if (isInIframe) {
        return <>{children}</>;
    }

    const PLACEHOLDER_KEY = 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k';
    const keyToUse = publishableKey || PLACEHOLDER_KEY;

    return (
        <ClerkProvider publishableKey={keyToUse}>
            {children}
        </ClerkProvider>
    );
}

export default ConditionalClerkProvider;
