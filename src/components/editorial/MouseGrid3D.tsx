'use client';

// Smooth cursor-following spotlight + 3D halo.
// - Mousemove drives a target (tx, ty). On every animation frame we
//   ease the rendered position toward the target so the halo glides
//   rather than snapping. Velocity is captured per frame and used to
//   tilt the halo on its X/Y axes — feels like it's reacting to motion.
// - --mx / --my CSS vars on <html> drive the radial spotlight in
//   .ik-backdrop::before (same gradient just follows the cursor).
// - pointer-events:none + mix-blend-mode:screen so the halo brightens
//   whatever it crosses without ever blocking clicks.

import { useEffect, useRef } from 'react';

const SIZE = 200; // halo diameter — larger than a grid cell so the
                  // hovered area feels like a region, not one square

export function MouseGrid3D() {
  const tileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    let tx = -1000;
    let ty = -1000;
    let cx = -1000;
    let cy = -1000;
    let lastCx = -1000;
    let lastCy = -1000;
    let raf = 0;
    let active = false;

    const tick = () => {
      // Ease the rendered position toward the cursor target.
      const k = 0.18; // higher = snappier, lower = smoother
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;

      // Velocity drives the tilt — moving right tips the halo left, etc.
      const vx = cx - lastCx;
      const vy = cy - lastCy;
      lastCx = cx;
      lastCy = cy;

      // Clamp tilt so fast moves don't yank the halo into a flat spin.
      const rotY = Math.max(-14, Math.min(14, vx * 0.6));
      const rotX = Math.max(-14, Math.min(14, -vy * 0.6));

      // Spotlight follows continuously (no snap).
      root.style.setProperty('--mx', `${cx}px`);
      root.style.setProperty('--my', `${cy}px`);

      const tile = tileRef.current;
      if (tile) {
        // Center the halo on the cursor.
        tile.style.transform =
          `translate3d(${cx - SIZE / 2}px, ${cy - SIZE / 2}px, 0) ` +
          `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(18px)`;
      }

      // Keep ticking while the cursor is active so easing finishes
      // even after the user stops moving.
      const dist = Math.hypot(tx - cx, ty - cy);
      if (active || dist > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!active) {
        active = true;
        // Seed the eased position so the halo doesn't dart from a
        // stale (-1000, -1000) on first appearance.
        if (cx < 0 && cy < 0) {
          cx = tx;
          cy = ty;
          lastCx = cx;
          lastCy = cy;
        }
        if (tileRef.current) tileRef.current.style.opacity = '1';
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      active = false;
      if (tileRef.current) tileRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
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
        width: SIZE,
        height: SIZE,
        pointerEvents: 'none',
        zIndex: 5,
        mixBlendMode: 'screen',
        opacity: 0,
        transition: 'opacity 300ms ease',
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
    />
  );
}
