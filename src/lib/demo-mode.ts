/**
 * Demo Mode Utility
 * When NEXT_PUBLIC_DEMO_MODE is set to 'true', admin panel modifications are disabled
 */

export const isDemoMode = (): boolean => {
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

export const DEMO_MODE_MESSAGE = "This is a demo. Admin changes are disabled.";
