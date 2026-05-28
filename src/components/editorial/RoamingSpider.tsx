'use client';

// Crawling matte-black "Keeda" — fixed position, 60s viewport tour.
// Asset: drop a photoreal transparent-bg PNG at /public/spider.png to
// override the bundled SVG silhouette fallback.

const SPIDER_SRC = '/spider.svg';

export function RoamingSpider() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed ik-crawl"
      style={{ zIndex: 30, top: '12vh', left: '-6vw' }}
    >
      {/* Thin vertical thread above the spider — always looks like it's
          hanging from somewhere just out of frame. */}
      <div
        className="absolute left-1/2 -translate-x-1/2 ik-thread"
        style={{ width: 1, height: 64, bottom: '100%' }}
      />
      <div className="ik-leg-wiggle" style={{ filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.18))' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SPIDER_SRC}
          alt=""
          width={108}
          height={108}
          style={{ display: 'block', width: 108, height: 108 }}
          draggable={false}
        />
      </div>
    </div>
  );
}
