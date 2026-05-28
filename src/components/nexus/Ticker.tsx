'use client';

// CSS-only marquee — items duplicated so the loop is seamless.

const ITEMS = [
  'Claude Sonnet 4.5',
  'Cursor',
  'Midjourney v7',
  'ElevenLabs',
  'Runway',
  'Perplexity',
  'v0',
];

export function Ticker({ items = ITEMS }: { items?: string[] }) {
  const loop = [...items, ...items];
  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)',
      }}
    >
      <div
        className="ik-marquee flex w-max items-center gap-10 whitespace-nowrap"
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 12,
          color: 'var(--ink-soft)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span style={{ color: 'var(--ink-2)' }}>{item}</span>
            <span aria-hidden="true" style={{ color: 'var(--accent)' }}>●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
