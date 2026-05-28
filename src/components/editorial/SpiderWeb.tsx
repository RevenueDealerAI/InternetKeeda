'use client';

import { useMemo } from 'react';

type WebProps = {
  spokeCount: number;
  ringCount: number;
  radius: number;
  startAngle: number;
  sweep: number;
  jitterSeed: number;
};

function jitter(seed: number, i: number, magnitude = 3.2): number {
  const v = Math.sin((seed + i) * 12.9898) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * 2 * magnitude;
}

function buildWebPaths({ spokeCount, ringCount, radius, startAngle, sweep, jitterSeed }: WebProps) {
  const spokes: string[] = [];
  const rings: string[] = [];

  const angles: number[] = [];
  for (let i = 0; i < spokeCount; i++) {
    const a = startAngle + (sweep * i) / (spokeCount - 1);
    angles.push((a * Math.PI) / 180);
  }

  for (let i = 0; i < spokeCount; i++) {
    const a = angles[i];
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    spokes.push(`M 0 0 L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  for (let r = 1; r <= ringCount; r++) {
    const ringRadius = (radius * r) / (ringCount + 0.5);
    let d = '';
    for (let i = 0; i < spokeCount; i++) {
      const a = angles[i];
      const px = Math.cos(a) * ringRadius + jitter(jitterSeed, i * (r + 1), 2.6);
      const py = Math.sin(a) * ringRadius + jitter(jitterSeed + 7, i * (r + 1), 2.6);
      if (i === 0) {
        d += `M ${px.toFixed(2)} ${py.toFixed(2)}`;
      } else {
        const prevA = angles[i - 1];
        const midA = (a + prevA) / 2;
        const sag = ringRadius * 0.94 + jitter(jitterSeed + r * 3, i, 1.8);
        const cx = Math.cos(midA) * sag;
        const cy = Math.sin(midA) * sag;
        d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)}, ${px.toFixed(2)} ${py.toFixed(2)}`;
      }
    }
    rings.push(d);
  }

  return { spokes, rings };
}

function CornerWeb({
  position,
  size,
  opacity,
  webProps,
  swayClass,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  size: number;
  opacity: number;
  webProps: WebProps;
  swayClass: string;
}) {
  const { spokes, rings } = useMemo(() => buildWebPaths(webProps), [webProps]);

  // Anchor point inside the SVG is the corner; we rotate the SVG so the
  // open quadrant points into the page.
  const transforms: Record<typeof position, string> = {
    tl: 'translate(0,0)',
    tr: 'translate(100%,0) scale(-1,1)',
    bl: 'translate(0,100%) scale(1,-1)',
    br: 'translate(100%,100%) scale(-1,-1)',
  };

  const positionClass = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  }[position];

  return (
    <div
      className={`absolute ${positionClass} ${swayClass}`}
      style={{ width: size, height: size, opacity }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.6}
        strokeLinecap="round"
        style={{ color: 'hsl(var(--foreground))' }}
      >
        <g transform={transforms[position]}>
          {spokes.map((d, i) => (
            <path key={`s-${i}`} d={d} opacity={0.85} />
          ))}
          {rings.map((d, i) => (
            <path key={`r-${i}`} d={d} opacity={0.75 - i * 0.04} />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function SpiderWeb() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -10 }}
    >
      <CornerWeb
        position="tl"
        size={460}
        opacity={0.18}
        swayClass="ik-web-sway"
        webProps={{ spokeCount: 14, ringCount: 7, radius: 460, startAngle: 0, sweep: 90, jitterSeed: 13 }}
      />
      <CornerWeb
        position="tr"
        size={380}
        opacity={0.14}
        swayClass="ik-web-sway-2"
        webProps={{ spokeCount: 12, ringCount: 6, radius: 380, startAngle: 0, sweep: 90, jitterSeed: 47 }}
      />
      <CornerWeb
        position="bl"
        size={300}
        opacity={0.12}
        swayClass="ik-web-sway-3"
        webProps={{ spokeCount: 11, ringCount: 5, radius: 300, startAngle: 0, sweep: 90, jitterSeed: 91 }}
      />
      <BottomRightStrands />
    </div>
  );
}

function BottomRightStrands() {
  // Just a few thin diagonal strands going to the corner — no rings.
  const strands = useMemo(() => {
    const out: { d: string; o: number }[] = [];
    const seeds = [3, 11, 19, 27, 35];
    seeds.forEach((seed, i) => {
      const startX = 220 - i * 16 + jitter(seed, 0, 4);
      const startY = 220 - i * 8 + jitter(seed, 1, 4);
      const ctrlX = 160 + jitter(seed, 2, 12);
      const ctrlY = 160 + jitter(seed, 3, 12);
      out.push({
        d: `M 220 220 Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)}, ${startX.toFixed(1)} ${startY.toFixed(1)}`,
        o: 0.6 - i * 0.08,
      });
    });
    return out;
  }, []);

  return (
    <div
      className="absolute bottom-0 right-0 ik-web-sway-4"
      style={{ width: 220, height: 220, opacity: 0.16 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 220 220"
        width={220}
        height={220}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.6}
        strokeLinecap="round"
        style={{ color: 'hsl(var(--foreground))' }}
      >
        {strands.map((s, i) => (
          <path key={i} d={s.d} opacity={s.o} />
        ))}
      </svg>
    </div>
  );
}
