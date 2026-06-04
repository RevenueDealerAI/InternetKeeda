'use client';

// Shared logo cell for any place a tool appears.
// - Renders the logo via getToolLogo(tool) (Clearbit → Google favicon
//   → ui-avatars fallback chain).
// - If the <Image> errors at runtime (the favicon URL 404s, the
//   provider blocks Image optimization, the tool has no website…)
//   it swaps to the first letter of the tool name on an accent-soft
//   tile.
//
// Use everywhere a tool card / row / list item / avatar is rendered.

import Image from 'next/image';
import { useState } from 'react';
import { getToolLogo } from '@/utils/toolHelpers';
import type { Tool } from '@/types/tool';

type ToolLogoProps = {
  tool: Pick<Tool, 'name' | 'logo' | 'websiteUrl' | 'slug'> & Partial<Tool>;
  /** Square edge in px. Default 48. */
  size?: number;
  /** Border radius in px. Default 12. */
  radius?: number;
  /** Use a white plate behind the logo image (helps off-light logos
   *  read on dark backgrounds). Default true. */
  whitePlate?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/** Build initials for the fallback tile.
 *  - "OpenART"        → "OA"  (camelCase / mixed-case word)
 *  - "PhantomBuster"  → "PB"
 *  - "ElevenLabs"     → "EL"
 *  - "Internet Keeda" → "IK"  (multi-word: first letter of first two words)
 *  - "GPT-4"          → "G4"  (strips separators, keeps alphanumerics)
 *  - "x"              → "X"   (single letter stays single)
 *  - empty / null     → "?"
 */
function toolInitials(name: string | undefined): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const words = trimmed.split(/[\s\-_.+/]+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  const w = words[0];
  // Single word — try to split on internal capital letters (camelCase
  // like "PhantomBuster", "OpenART", "ElevenLabs"). If we find a
  // capital that is not the first character, use first + that capital.
  for (let i = 1; i < w.length; i++) {
    if (w[i] >= 'A' && w[i] <= 'Z' && (w[i - 1] < 'A' || w[i - 1] > 'Z')) {
      return (w[0] + w[i]).toUpperCase();
    }
  }
  // No internal capital — if the name has any digit, pair first letter
  // with the first digit ("GPT-4" → "G4"). Otherwise just first letter.
  const digit = w.match(/\d/)?.[0];
  if (digit) return (w[0] + digit).toUpperCase();
  return w[0].toUpperCase();
}

export function ToolLogo({
  tool,
  size = 48,
  radius = 12,
  whitePlate = true,
  className,
  style,
}: ToolLogoProps) {
  const url = getToolLogo(tool as Tool);
  const initials = toolInitials(tool.name);
  const [failed, setFailed] = useState(false);
  const showInitial = failed || !url;

  if (showInitial) {
    // Scale font down a touch when there are 2 characters so they
    // don't crowd the tile or push outside the radius on small sizes.
    const fontSize = initials.length >= 2
      ? Math.max(11, Math.floor(size * 0.38))
      : Math.max(14, Math.floor(size * 0.46));
    return (
      <div
        aria-label={`${tool.name} (logo unavailable)`}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--accent-soft)',
          border: '1px solid var(--rule)',
          color: 'var(--accent)',
          fontFamily: 'var(--sans)',
          fontWeight: 700,
          fontSize,
          letterSpacing: '-0.02em',
          ...style,
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        background: whitePlate ? '#fff' : 'transparent',
        border: '1px solid var(--rule)',
        ...style,
      }}
    >
      <Image
        src={url}
        alt={`${tool.name} logo`}
        fill
        sizes={`${size}px`}
        className="object-contain"
        style={{ padding: Math.max(4, Math.floor(size * 0.12)) }}
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}
