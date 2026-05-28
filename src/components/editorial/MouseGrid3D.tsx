'use client';

// Interactive grid backdrop layer.
// - Mousemove updates CSS vars --mx / --my on <html> so the .ik-backdrop
//   spotlight gradient follows the cursor (brightens nearby cells).
// - A separate fixed-position "tile" snaps to the grid cell under the
//   cursor and lifts up in 3D (translateZ + tilt + blood glow).
// - rAF throttle keeps it cheap. pointer-events: none so it never
//   blocks any underlying click.

import { useEffect, useRef } from 'react';

const GRID = 56; // matches --grid-size in CSS

export function MouseGrid3D() {
  const tileRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    const applyFrame = () => {
      rafRef.current = null;
      const p = pending.current;
      if (!p || !tileRef.current) return;
      // Update spotlight position (used by .ik-backdrop)
      root.style.setProperty('--mx', `${p.x}px`);
      root.style.setProperty('--my', `${p.y}px`);

      // Snap to grid cell
      const cellX = Math.floor(p.x / GRID) * GRID;
      const cellY = Math.floor(p.y / GRID) * GRID;

      // 3D tilt based on cursor's offset inside the cell.
      const dx = (p.x - (cellX + GRID / 2)) / (GRID / 2); // -1..1
      const dy = (p.y - (cellY + GRID / 2)) / (GRID / 2);
      const rotY = dx * 8;
      const rotX = -dy * 8;

      tileRef.current.style.transform =
        `translate3d(${cellX}px, ${cellY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(14px)`;
      tileRef.current.style.opacity = '1';
    };

    const onMove = (e: MouseEvent) => {
      pending.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(applyFrame);
    };

    const onLeave = () => {
      if (tileRef.current) tileRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={tileRef}
      aria-hidden="true"
      className="ik-grid-tile"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: GRID,
        height: GRID,
        pointerEvents: 'none',
        // Render on top of content but mix-blend so it never obscures
        // text or clickable elements — it adds light, doesn't replace.
        zIndex: 5,
        mixBlendMode: 'screen',
        opacity: 0,
        transition: 'opacity 250ms ease',
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
    />
  );
}
