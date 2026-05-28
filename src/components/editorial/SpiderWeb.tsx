'use client';

// Full-page hand-drawn spider web background. Renders four cobweb
// SVGs in the four corners + tiny accent spiders sitting inside the
// big webs (visible in the reference screenshots). Sits at z-[-10],
// pointer-events-none, ivory-on-foreground. Webs extend off the
// page edges via negative offsets so they wrap around the corner.

const SPIDER_SRC = '/spider.png';

export function SpiderWeb() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -10, color: 'hsl(var(--foreground))' }}
    >
      {/* TOP-LEFT — biggest, densest. 16 spokes, 8 rings. */}
      <svg
        className="absolute -top-20 -left-20 ik-web-sway opacity-[0.18]"
        style={{
          width: '55vw',
          height: '55vw',
          maxWidth: 820,
          maxHeight: 820,
        }}
        viewBox="0 0 420 420"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.6}
        strokeLinecap="round"
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * Math.PI) / 16;
          const x2 = Math.cos(a) * 440;
          const y2 = Math.sin(a) * 440;
          return <line key={`s-${i}`} x1={0} y1={0} x2={x2} y2={y2} />;
        })}
        {[36, 72, 116, 168, 226, 290, 360, 420].map((r, idx) => (
          <g key={r}>
            {Array.from({ length: 16 }).map((_, i) => {
              const a1 = (i * Math.PI) / 16;
              const a2 = ((i + 1) * Math.PI) / 16;
              const jitter = (idx % 2 === 0 ? 1 : -1) * (3 + (i % 3));
              const x1 = Math.cos(a1) * r;
              const y1 = Math.sin(a1) * r;
              const x2 = Math.cos(a2) * (r + jitter);
              const y2 = Math.sin(a2) * (r + jitter);
              const cx = ((x1 + x2) / 2) * 0.92;
              const cy = ((y1 + y2) / 2) * 0.92;
              return (
                <path key={`r${idx}-${i}`} d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} />
              );
            })}
          </g>
        ))}
      </svg>

      {/* Tiny accent spider sitting in top-left web */}
      <AccentSpider top="9vw" left="9vw" size={28} rotate={28} delay="0s" />

      {/* TOP-RIGHT — mirrored, 14 spokes, 6 rings. */}
      <svg
        className="absolute -top-16 -right-24 ik-web-sway-2 opacity-[0.14]"
        style={{
          width: '46vw',
          height: '46vw',
          maxWidth: 720,
          maxHeight: 720,
          transform: 'scaleX(-1)',
        }}
        viewBox="0 0 420 420"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.6}
        strokeLinecap="round"
      >
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i * Math.PI) / 14;
          const x2 = Math.cos(a) * 440;
          const y2 = Math.sin(a) * 440;
          return <line key={`s-${i}`} x1={0} y1={0} x2={x2} y2={y2} />;
        })}
        {[46, 92, 148, 214, 286, 360].map((r, idx) => (
          <g key={r}>
            {Array.from({ length: 14 }).map((_, i) => {
              const a1 = (i * Math.PI) / 14;
              const a2 = ((i + 1) * Math.PI) / 14;
              const jitter = (idx % 2 === 0 ? 1 : -1) * (4 + (i % 2));
              const x1 = Math.cos(a1) * r;
              const y1 = Math.sin(a1) * r;
              const x2 = Math.cos(a2) * (r + jitter);
              const y2 = Math.sin(a2) * (r + jitter);
              const cx = ((x1 + x2) / 2) * 0.9;
              const cy = ((y1 + y2) / 2) * 0.9;
              return (
                <path key={`r${idx}-${i}`} d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} />
              );
            })}
          </g>
        ))}
      </svg>

      {/* Tiny accent spider sitting in top-right web */}
      <AccentSpider top="8vw" right="10vw" size={24} rotate={-15} delay="2s" />

      {/* BOTTOM-LEFT — small full-circle web, 16 spokes, 5 rings. */}
      <svg
        className="absolute -bottom-24 -left-16 ik-web-sway-3 opacity-[0.12]"
        style={{
          width: '38vw',
          height: '38vw',
          maxWidth: 580,
          maxHeight: 580,
        }}
        viewBox="-220 -220 440 440"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.55}
        strokeLinecap="round"
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * 2 * Math.PI) / 16;
          const x2 = Math.cos(a) * 230;
          const y2 = Math.sin(a) * 230;
          return <line key={`s-${i}`} x1={0} y1={0} x2={x2} y2={y2} />;
        })}
        {[30, 60, 100, 145, 195].map((r, idx) => (
          <g key={r}>
            {Array.from({ length: 16 }).map((_, i) => {
              const a1 = (i * 2 * Math.PI) / 16;
              const a2 = ((i + 1) * 2 * Math.PI) / 16;
              const jitter = (idx % 2 === 0 ? 1 : -1) * 3;
              const x1 = Math.cos(a1) * r;
              const y1 = Math.sin(a1) * r;
              const x2 = Math.cos(a2) * (r + jitter);
              const y2 = Math.sin(a2) * (r + jitter);
              const cx = ((x1 + x2) / 2) * 0.94;
              const cy = ((y1 + y2) / 2) * 0.94;
              return (
                <path key={`r${idx}-${i}`} d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} />
              );
            })}
          </g>
        ))}
      </svg>

      {/* Tiny accent spider sitting in bottom-left web */}
      <AccentSpider bottom="7vw" left="7vw" size={22} rotate={-200} delay="4s" />

      {/* BOTTOM-RIGHT — thin strand cluster (no rings, no spider) */}
      <svg
        className="absolute bottom-0 right-0 ik-web-sway-4 opacity-[0.13]"
        style={{
          width: '36vw',
          height: '36vw',
          maxWidth: 520,
          maxHeight: 520,
        }}
        viewBox="0 0 420 420"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.55}
        strokeLinecap="round"
      >
        <path d="M 420 420 L 60 400 M 420 420 L 110 340 M 420 420 L 210 290 M 420 420 L 330 190 M 420 420 L 400 50" />
        <path d="M 90 400 Q 220 370 400 110" />
        <path d="M 60 380 Q 240 330 400 70" />
        <path d="M 130 410 Q 280 380 410 220" />
      </svg>
    </div>
  );
}

// Tiny matte-black spider sitting inside a corner web — uses the
// same PNG as the mascot, sized way down. Slowly bobs in place.
function AccentSpider({
  top,
  bottom,
  left,
  right,
  size,
  rotate,
  delay,
}: {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
  rotate: number;
  delay: string;
}) {
  return (
    <div
      className="absolute ik-float-y-slow"
      style={{
        top,
        bottom,
        left,
        right,
        width: size,
        height: size,
        animationDelay: delay,
        opacity: 0.55,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SPIDER_SRC}
        alt=""
        width={size}
        height={size}
        style={{
          display: 'block',
          width: size,
          height: size,
          filter:
            'drop-shadow(0 0 6px rgba(229, 9, 20, 0.5)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))',
        }}
        draggable={false}
      />
    </div>
  );
}
