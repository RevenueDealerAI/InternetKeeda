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

export function ToolLogo({
  tool,
  size = 48,
  radius = 12,
  whitePlate = true,
  className,
  style,
}: ToolLogoProps) {
  const url = getToolLogo(tool as Tool);
  const initial = (tool.name?.[0] || '?').toUpperCase();
  const [failed, setFailed] = useState(false);
  const showInitial = failed || !url;

  if (showInitial) {
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
          fontSize: Math.max(14, Math.floor(size * 0.46)),
          letterSpacing: '-0.02em',
          ...style,
        }}
      >
        {initial}
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
