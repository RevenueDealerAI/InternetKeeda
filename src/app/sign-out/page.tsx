"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useSignOut } from "@/hooks/useSignOut";

/**
 * One-shot sign-out page. The navbar can't call useClerk() directly
 * (the homepage tree deliberately doesn't mount ClerkProvider — it
 * was the source of an earlier crash and would also drag the Clerk
 * SDK into the home critical path). Instead, navbar Sign out links
 * here. This page lives under /sign-out/layout.tsx which mounts
 * ClerkRouteWrapper, so the Clerk hook works. On mount we call the
 * shared useSignOut() hook, which signs out + hard-navigates home.
 *
 * The hard-nav is load-bearing: useClerkSession() on the homepage
 * caches its cookie read until window focus / mount, so a soft
 * router.replace() would leave the navbar showing the signed-in
 * dropdown. See src/hooks/useSignOut.ts.
 */
export default function SignOutPage() {
  const doSignOut = useSignOut();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    doSignOut();
  }, [doSignOut]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Signing you out…
      </div>
    </main>
  );
}
