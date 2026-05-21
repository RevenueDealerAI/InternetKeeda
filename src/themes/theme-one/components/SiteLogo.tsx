"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  /** Which variant to render. "auto" plays animated once per session then
   * falls back to the static light variant. */
  variant?: "auto" | "light" | "dark" | "animated" | "still";
  className?: string;
  /** Height in px — width scales automatically. Acts as the asset's
   * intrinsic render height; when heightClass is also provided, this
   * should be the LARGEST visible height (HiDPI-crisp at every breakpoint). */
  height?: number;
  /** Optional responsive Tailwind height utility (e.g. "h-11 md:h-[52px] lg:h-14").
   * When set, overrides the inline px height so the logo can shrink at
   * smaller breakpoints while still rendering from the larger asset. */
  heightClass?: string;
  /** Wrap in a <Link href="/">. Default true. */
  asLink?: boolean;
  priority?: boolean;
  alt?: string;
}

const SESSION_KEY = "ik_logo_played";

const ASSET = {
  light: "/branding/logo-light.png",
  dark: "/branding/logo-dark.png",
  animated: "/branding/logo-animated.gif",
  still: "/branding/logo-still.gif",
} as const;

/** Site logo. In "auto" mode the animated GIF plays once per browser
 * session — keyed on sessionStorage — and every subsequent render in
 * that session shows the static light PNG. The static variants render
 * directly without the session-flag dance. */
export const SiteLogo = ({
  variant = "auto",
  className,
  height = 40,
  heightClass,
  asLink = true,
  priority = false,
  alt = "InternetKeeda",
}: SiteLogoProps) => {
  const [src, setSrc] = useState<string>(() =>
    variant === "auto"
      ? ASSET.light // SSR-safe default; client effect swaps to animated for the first visit
      : ASSET[variant]
  );

  useEffect(() => {
    if (variant !== "auto") return;
    // Mobile-first perf: the animated GIF is 2.7 MB and would dominate
    // LCP on a cold 4G connection. Skip it entirely on small viewports;
    // desktop + tablet still get the first-load animation.
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) return;
    try {
      const played = sessionStorage.getItem(SESSION_KEY);
      if (!played) {
        setSrc(ASSET.animated);
        sessionStorage.setItem(SESSION_KEY, "1");
        const t = setTimeout(() => setSrc(ASSET.light), 2400);
        return () => clearTimeout(t);
      }
    } catch {
      // sessionStorage unavailable (privacy mode, embedded iframe). Just
      // stay with the static light variant — no animation lost forever.
    }
  }, [variant]);

  // Aspect ratio of the source PNG/GIF is roughly 853:480 (~1.78).
  // Width is computed from height for crisp Image sizing.
  const width = Math.round(height * 1.78);

  const img = (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      priority={priority}
      unoptimized={src.endsWith(".gif")}
      className={cn(
        "object-contain transition-opacity w-auto",
        heightClass,
        className,
      )}
      style={heightClass ? undefined : { height, width: "auto" }}
    />
  );

  if (!asLink) return img;
  return (
    <Link href="/" aria-label="InternetKeeda — home" className="inline-flex items-center group">
      {img}
    </Link>
  );
};
