'use client';

// Particle-graph canvas. Nodes drift on damped random velocity. Lines
// drawn between pairs within maxDist with alpha proportional to
// inverse distance. Mouse repulsion within 120px so the network
// reacts to the cursor. Devicepixel-aware. ResizeObserver re-inits on
// container resize. ~3KB after gzip — no three.js.
//
// Reference: §7-A of CLAUDE.md.

import { useEffect, useRef } from 'react';

type NeuralCanvasProps = {
  /** Particle density per square px. Hero: 0.00010. Agent panel: 0.00040. */
  density?: number;
  /** Max line distance in px. Hero: 160. Agent panel: 110. */
  maxDist?: number;
  /** Velocity multiplier. */
  speed?: number;
  /** Stroke / dot color. Pass the resolved accent (e.g. "#ff3b3b"). */
  color?: string;
  /** Mouse interaction. False = static, no repulsion. */
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

type Node = { x: number; y: number; vx: number; vy: number };

export function NeuralCanvas({
  density = 0.0001,
  maxDist = 160,
  speed = 0.28,
  color,
  interactive = true,
  className,
  style,
}: NeuralCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let nodes: Node[] = [];
    let w = 0;
    let h = 0;
    let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    let raf = 0;
    let mx = -9999;
    let my = -9999;
    let resolvedColor = color;

    const resolveColor = (): string => {
      if (color) return color;
      // Walk the DOM for --accent in case the component renders inside
      // a section that overrides the token.
      const cs = getComputedStyle(container);
      const c = cs.getPropertyValue('--accent').trim();
      return c || '#ff3b3b';
    };

    const init = () => {
      const rect = container.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resolvedColor = resolveColor();

      const n = Math.max(16, Math.min(220, Math.floor(density * w * h)));
      nodes = [];
      for (let i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Update positions
      for (const node of nodes) {
        if (interactive) {
          const dx = node.x - mx;
          const dy = node.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120) {
            const force = (120 - Math.sqrt(d2)) / 120;
            node.vx += (dx / (Math.sqrt(d2) || 1)) * force * 0.18;
            node.vy += (dy / (Math.sqrt(d2) || 1)) * force * 0.18;
          }
        }
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.99;
        node.vy *= 0.99;
        if (node.x < 0) { node.x = 0; node.vx *= -1; }
        if (node.x > w) { node.x = w; node.vx *= -1; }
        if (node.y < 0) { node.y = 0; node.vy *= -1; }
        if (node.y > h) { node.y = h; node.vy *= -1; }
      }

      // Lines between close pairs
      ctx.lineWidth = 1;
      const maxD2 = maxDist * maxDist;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / maxDist) * 0.35;
            ctx.strokeStyle = withAlpha(resolvedColor || '#ff3b3b', alpha);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      ctx.fillStyle = withAlpha(resolvedColor || '#ff3b3b', 0.85);
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };
    const onLeave = () => {
      mx = -9999;
      my = -9999;
    };

    init();
    raf = requestAnimationFrame(draw);

    if (interactive) {
      container.addEventListener('mousemove', onMove);
      container.addEventListener('mouseleave', onLeave);
    } else {
      window.addEventListener('mousemove', onMove);
    }

    const ro = new ResizeObserver(() => {
      init();
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (interactive) {
        container.removeEventListener('mousemove', onMove);
        container.removeEventListener('mouseleave', onLeave);
      } else {
        window.removeEventListener('mousemove', onMove);
      }
    };
  }, [density, maxDist, speed, color, interactive]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: interactive ? 'auto' : 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}

// Tiny hex/rgb → rgba helper. Handles #rgb / #rrggbb / rgb(...) /
// already-rgba(). Anything else falls back to the input.
function withAlpha(color: string, a: number): string {
  if (!color) return `rgba(255,59,59,${a})`;
  const c = color.trim();
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    let r = 0;
    let g = 0;
    let b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    return `rgba(${r},${g},${b},${a})`;
  }
  const m = c.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(',').map((s) => s.trim());
    const r = parts[0];
    const g = parts[1];
    const b = parts[2];
    return `rgba(${r},${g},${b},${a})`;
  }
  return c;
}
