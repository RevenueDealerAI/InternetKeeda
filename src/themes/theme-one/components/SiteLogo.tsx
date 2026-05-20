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
  /** Height in px — width scales automatically. */
  height?: number;
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
    try {
      const played = sessionStorage.getItem(SESSION_KEY);
      if (!played) {
        setSrc(ASSET.animated);
        sessionStorage.setItem(SESSION_KEY, "1");
        // The GIF loops by default. We don't have per-loop callbacks, so
        // swap back to the static PNG after one play (~2s based on the
        // file). That keeps the mark visually quiet on every other render
        // in the session.
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
      className={cn("object-contain transition-opacity", className)}
      style={{ height, width: "auto" }}
    />
  );

  if (!asLink) return img;
  return (
    <Link href="/" aria-label="InternetKeeda — home" className="inline-flex items-center group">
      {img}
    </Link>
  );
};
