"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * One-shot sign-out page. The navbar can't call useClerk() directly
 * (the homepage tree deliberately doesn't mount ClerkProvider — it
 * was the source of an earlier crash). Instead, navbar Sign out
 * links here. This page lives under /sign-out/layout.tsx which
 * mounts ClerkRouteWrapper, so the hook works. On mount we call
 * signOut() then bounce home.
 */
export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await signOut();
      } catch {
        // Even if signOut throws, push the user home — Clerk's
        // cookie was probably already cleared.
      }
      if (!cancelled) router.replace("/");
    })();
    return () => {
      cancelled = true;
    };
  }, [signOut, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Signing you out…
      </div>
    </main>
  );
}
