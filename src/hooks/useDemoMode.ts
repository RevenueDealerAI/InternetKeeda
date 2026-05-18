"use client";

import { isDemoMode, DEMO_MODE_MESSAGE } from '@/lib/demo-mode';
import { useToast } from '@/components/ui/use-toast';
import { useCallback } from 'react';

/**
 * Hook that provides demo mode utilities
 * Returns functions to check demo mode and show toast notifications
 */
export function useDemoMode() {
    const { toast } = useToast();

    const isDemo = isDemoMode();

    const showDemoToast = useCallback(() => {
        toast({
            title: "Demo Mode Active",
            description: DEMO_MODE_MESSAGE,
            variant: "destructive",
        });
    }, [toast]);

    /**
     * Wrapper function that blocks the action if in demo mode
     * Returns true if action was blocked (demo mode), false if action can proceed
     */
    const blockIfDemo = useCallback((): boolean => {
        if (isDemo) {
            showDemoToast();
            return true;
        }
        return false;
    }, [isDemo, showDemoToast]);

    /**
     * Wrapper for async functions that blocks execution in demo mode
     */
    const guardAction = useCallback(<T extends (...args: unknown[]) => Promise<unknown>>(
        fn: T
    ): ((...args: Parameters<T>) => Promise<ReturnType<T> | undefined>) => {
        return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
            if (isDemo) {
                showDemoToast();
                return undefined;
            }
            return fn(...args) as Promise<ReturnType<T>>;
        };
    }, [isDemo, showDemoToast]);

    return {
        isDemo,
        showDemoToast,
        blockIfDemo,
        guardAction,
    };
}
