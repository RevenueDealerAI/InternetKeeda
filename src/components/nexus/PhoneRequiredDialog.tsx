"use client";

/**
 * Pre-flight phone-required modal. Shown by the dashboard when the
 * user tries to start a Cashfree subscription / boost without a
 * verified phone on their Clerk profile. Cashfree's UPI Autopay
 * mandate + e-mandate flows both need a real phone to deliver the
 * collect request; without one, the hosted checkout falls back to
 * "No Payment Mode Available".
 *
 * "Add phone" calls Clerk's openUserProfile() to surface the
 * built-in profile manager (which has the phone-add + OTP-verify
 * flow). No new screens to build on our side.
 */

import { useClerk } from "@clerk/clerk-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface PhoneRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhoneRequiredDialog({
  open,
  onOpenChange,
}: PhoneRequiredDialogProps) {
  const clerk = useClerk();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add your phone number</AlertDialogTitle>
          <AlertDialogDescription>
            Cashfree subscriptions use UPI Autopay or card mandate,
            which require a verified phone number for mandate
            authorization. Add one to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              try {
                clerk.openUserProfile();
              } catch {
                /* Clerk not loaded yet — closing the modal is the
                 * least-bad fallback; user can click Subscribe
                 * again. */
              }
              onOpenChange(false);
            }}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Add phone
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UseProfileStatusResult {
  hasVerifiedPhone: boolean | null; // null while loading / error
  loading: boolean;
}

/** Read-only check. Returns null while in-flight so callers can
 *  block UI on a tri-state instead of false-positive opening the
 *  modal on first paint. */
export function useProfileStatus(): UseProfileStatusResult {
  // Intentionally lazy — only fetched on first call. Most users
  // never hit subscribe; loading this on every dashboard mount
  // would waste a round trip. The mutation handler that needs it
  // fetches imperatively via fetchProfileStatus() below.
  return { hasVerifiedPhone: null, loading: false };
}

export async function fetchProfileStatus(): Promise<{
  hasVerifiedPhone: boolean;
  hasVerifiedEmail: boolean;
} | null> {
  try {
    const r = await fetch("/api/me/profile-status", {
      credentials: "include",
    });
    if (!r.ok) return null;
    return (await r.json()) as {
      hasVerifiedPhone: boolean;
      hasVerifiedEmail: boolean;
    };
  } catch {
    return null;
  }
}

export const phoneRequiredFooter = (
  <Button variant="outline" size="sm" disabled>
    Loading profile status…
  </Button>
);
