'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function AffiliateTracker() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (!isLoaded || !user) return;

        const checkReferral = async () => {
            // Check cookie
            const match = document.cookie.match(new RegExp('(^| )affiliate_code=([^;]+)'));
            if (match) {
                const code = match[2];
                try {
                    await fetch('/api/affiliate/track-referral', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code })
                    });
                    // We keep the cookie for now, or could delete it
                } catch (e) {
                    console.error('Failed to track referral', e);
                }
            }
        };

        checkReferral();
    }, [user, isLoaded]);

    return null;
}
