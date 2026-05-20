'use client';

import { useEffect } from 'react';
import { useClerkSession } from '@/hooks/useClerkSession';

/**
 * Detects an `?ref=` referral cookie set by middleware and pings the
 * affiliate-tracking endpoint once the visitor is signed in.
 *
 * Previously used `useUser` from @clerk/nextjs which pulled the Clerk
 * SDK into the root layout's chunk. Switched to useClerkSession
 * (cookie-only) so this can stay in the root layout for free.
 *
 * The server-side endpoint resolves the user from the session cookie
 * via @clerk/backend's requireAuth — it doesn't need a client-side
 * user object.
 */
export function AffiliateTracker() {
    const { isSignedIn, isLoaded } = useClerkSession();

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        const match = document.cookie.match(new RegExp('(^| )affiliate_code=([^;]+)'));
        if (!match) return;
        const code = match[2];

        fetch('/api/affiliate/track-referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ code }),
        }).catch((e) => console.error('Failed to track referral', e));
    }, [isSignedIn, isLoaded]);

    return null;
}
