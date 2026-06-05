/**
 * Generate the 3 Keeda Labs cover images as programmatic SVGs.
 *
 * History: this script originally hit Pollinations.ai (free, no key,
 * prompt-driven via Flux/SD) but Pollinations paywalled everything
 * in 2026. The free-no-key AI-image-gen niche is effectively dead.
 * Rather than ship random stock or hard-block on an external API,
 * we render the covers directly in SVG — dark cosmic gradient,
 * accent-red and amber highlights, per-workflow abstract motif.
 *
 * Each cover is:
 *   - 1280×720 SVG (Vercel Blob detects content-type from .svg
 *     filename; the passthrough route streams it back image/svg+xml)
 *   - Uploaded via uploadPublicCover() so it lives in private Blob
 *     and is reached through /api/store/cover/[id]
 *   - Set on the prod-DB StoreProduct.coverImageUrl
 *   - Mirrored to scripts/.preview/covers/ so we can screenshot
 *     before pushing publish
 *
 * Idempotent on slug — re-running overwrites coverImageUrl with the
 * latest generation. Old Blob is orphaned (admin can sweep later).
 *
 *   npx tsx scripts/generate-store-covers.ts
 *   npx tsx scripts/generate-store-covers.ts --seed 42  # reproducible
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { StoreProduct } from '../src/features/store/models/StoreProduct';
import { uploadPublicCover } from '../src/features/store/lib/storage';

const W = 1280;
const H = 720;

/* ─────────── deterministic pseudo-RNG so each cover is stable ────────── */

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ──────────────────────── shared backdrop ─────────────────────── */

function backdrop(rand: () => number): string {
  // Subtle starfield. Hand-tuned count + size for 1280×720.
  const stars: string[] = [];
  for (let i = 0; i < 90; i++) {
    const cx = rand() * W;
    const cy = rand() * H;
    const r = rand() < 0.85 ? rand() * 1.2 + 0.3 : rand() * 2.4 + 0.8;
    const o = (0.25 + rand() * 0.5).toFixed(2);
    stars.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" fill="#ffffff" opacity="${o}"/>`);
  }
  return `
  <defs>
    <radialGradient id="bg" cx="22%" cy="18%" r="78%">
      <stop offset="0%" stop-color="#1a0507" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#0a0a0c" stop-opacity="1"/>
      <stop offset="100%" stop-color="#050507" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="accentGlow" cx="80%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#ff3b3b" stop-opacity="0.32"/>
      <stop offset="60%" stop-color="#ff3b3b" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#ff3b3b" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
    <filter id="hardGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#accentGlow)"/>
  ${stars.join('')}`;
}

/* ─────────────────── Stripe → Sheets cover ────────────────────── */

function svgStripeToSheets(seedBase: number): string {
  const rand = mulberry32(seedBase);
  const cols = 9;
  const rows = 6;
  const cellW = 92;
  const cellH = 70;
  const gridX = (W - cols * cellW) / 2;
  const gridY = (H - rows * cellH) / 2 + 30;

  // Grid lines + light cell tint
  let grid = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gridX + c * cellW;
      const y = gridY + r * cellH;
      const fillIntensity = rand() < 0.18 ? 0.14 : 0;
      grid += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${
        fillIntensity ? `rgba(255,59,59,${fillIntensity})` : 'transparent'
      }" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`;
    }
  }

  // Three glowing rows of filled cells (the "paid invoice rows")
  const highlightRows = [1, 3, 4];
  let rowsHilite = '';
  for (const hr of highlightRows) {
    for (let c = 0; c < cols; c++) {
      const x = gridX + c * cellW;
      const y = gridY + hr * cellH;
      const alpha = 0.18 + rand() * 0.32;
      rowsHilite += `<rect x="${x + 2}" y="${y + 2}" width="${cellW - 4}" height="${cellH - 4}" fill="rgba(255,59,59,${alpha.toFixed(2)})" rx="4"/>`;
    }
    rowsHilite += `<rect x="${gridX - 12}" y="${gridY + hr * cellH + cellH / 2 - 3}" width="6" height="6" fill="#ff5a5a" filter="url(#softGlow)"/>`;
  }

  // Falling data particles (lines from top edge into grid)
  let particles = '';
  for (let i = 0; i < 14; i++) {
    const px = gridX + (rand() * cols * cellW);
    const len = 80 + rand() * 240;
    const y0 = 40 + rand() * 100;
    const y1 = y0 + len;
    const op = (0.25 + rand() * 0.45).toFixed(2);
    const color = rand() < 0.7 ? '#ff7a7a' : '#ffb86b';
    particles += `<line x1="${px}" y1="${y0}" x2="${px}" y2="${y1}" stroke="${color}" stroke-width="${(rand()*1.5+0.6).toFixed(2)}" stroke-linecap="round" opacity="${op}"/>`;
  }

  // Subtle horizontal axis label-bar at top (no readable text)
  const headerY = gridY - 28;
  let headerDots = '';
  for (let c = 0; c < cols; c++) {
    const x = gridX + c * cellW + cellW / 2;
    headerDots += `<rect x="${x - 16}" y="${headerY}" width="32" height="3" fill="rgba(255,255,255,0.18)" rx="1.5"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    ${backdrop(rand)}
    ${headerDots}
    ${grid}
    ${rowsHilite}
    <g filter="url(#hardGlow)" opacity="0.5">${particles}</g>
    ${particles}
  </svg>`;
}

/* ─────────────── RSS → AI Summary → WordPress cover ─────────── */

function svgRssToWordpress(seedBase: number): string {
  const rand = mulberry32(seedBase);
  // Left: cascading article fragments
  // Middle: neural-mesh node graph
  // Right: stacked published documents

  // Left: stack of article-like blocks (no text, just bars representing lines)
  let leftStack = '';
  for (let i = 0; i < 6; i++) {
    const x0 = 120;
    const y0 = 110 + i * 90;
    const w = 200;
    const h = 70;
    leftStack += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" rx="6"/>`;
    // bars representing text lines
    for (let l = 0; l < 4; l++) {
      const lw = (40 + rand() * 130);
      leftStack += `<rect x="${x0 + 10}" y="${y0 + 12 + l * 13}" width="${lw}" height="4" fill="rgba(255,255,255,0.18)" rx="2"/>`;
    }
  }

  // Middle: neural mesh — nodes + edges
  const meshCx = W / 2 + 30;
  const meshCy = H / 2;
  const nodeCount = 22;
  type Node = { x: number; y: number; r: number };
  const nodes: Node[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 60 + rand() * 130;
    nodes.push({
      x: meshCx + Math.cos(angle) * radius,
      y: meshCy + Math.sin(angle) * radius * 0.85,
      r: 2 + rand() * 4,
    });
  }
  let edges = '';
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.hypot(dx, dy);
      if (d < 95) {
        const op = ((95 - d) / 95 * 0.4).toFixed(2);
        edges += `<line x1="${nodes[i].x.toFixed(1)}" y1="${nodes[i].y.toFixed(1)}" x2="${nodes[j].x.toFixed(1)}" y2="${nodes[j].y.toFixed(1)}" stroke="#ff3b3b" stroke-width="0.7" opacity="${op}"/>`;
      }
    }
  }
  let dots = '';
  for (const n of nodes) {
    const isWarm = rand() < 0.4;
    dots += `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}" fill="${isWarm ? '#ffb86b' : '#ff5a5a'}" filter="url(#softGlow)" opacity="0.85"/>`;
  }

  // Right: 3 stacked published-document outlines
  let rightDocs = '';
  for (let i = 0; i < 3; i++) {
    const x0 = W - 280 + i * 12;
    const y0 = 220 - i * 18;
    const w = 200;
    const h = 270;
    rightDocs += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="rgba(20,20,24,0.92)" stroke="rgba(255,59,59,${(0.35 - i * 0.08).toFixed(2)})" stroke-width="1.5" rx="8"/>`;
    if (i === 0) {
      // top doc: highlighted lines
      for (let l = 0; l < 7; l++) {
        const lw = 30 + rand() * 150;
        rightDocs += `<rect x="${x0 + 16}" y="${y0 + 24 + l * 22}" width="${lw}" height="5" fill="rgba(255,255,255,${(0.3 + rand() * 0.4).toFixed(2)})" rx="2"/>`;
      }
      rightDocs += `<rect x="${x0 + 16}" y="${y0 + 200}" width="60" height="14" fill="#ff3b3b" rx="3" opacity="0.8"/>`;
    }
  }

  // Connector arrows: left → mesh → right
  const arrow = `
    <line x1="340" y1="${H/2}" x2="${meshCx - 200}" y2="${H/2}" stroke="rgba(255,59,59,0.4)" stroke-width="2" stroke-dasharray="6 6"/>
    <line x1="${meshCx + 200}" y1="${H/2}" x2="${W - 290}" y2="${H/2 - 10}" stroke="rgba(255,59,59,0.4)" stroke-width="2" stroke-dasharray="6 6"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    ${backdrop(rand)}
    ${leftStack}
    ${arrow}
    <g opacity="0.6">${edges}</g>
    ${dots}
    ${rightDocs}
  </svg>`;
}

/* ──────────────── Lead → Enrich → Slack cover ────────────────── */

function svgLeadToSlack(seedBase: number): string {
  const rand = mulberry32(seedBase);

  // Left center: human silhouette + concentric data rings
  const personCx = 320;
  const personCy = H / 2 + 30;
  const head = `
    <circle cx="${personCx}" cy="${personCy - 78}" r="34" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
    <path d="M ${personCx - 60} ${personCy + 70} Q ${personCx} ${personCy - 35} ${personCx + 60} ${personCy + 70} Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>`;

  let rings = '';
  for (let i = 0; i < 5; i++) {
    const r = 110 + i * 32;
    rings += `<circle cx="${personCx}" cy="${personCy - 30}" r="${r}" fill="none" stroke="rgba(255,59,59,${(0.4 - i * 0.07).toFixed(2)})" stroke-width="1" stroke-dasharray="${i === 0 ? '0' : '4 8'}"/>`;
  }

  // Floating enrichment "profile cards" around the rings
  let cards = '';
  const cardPositions = [
    { x: personCx - 60, y: personCy - 220 },
    { x: personCx + 130, y: personCy - 150 },
    { x: personCx + 170, y: personCy + 70 },
    { x: personCx - 200, y: personCy + 30 },
  ];
  for (const p of cardPositions) {
    const w = 100;
    const h = 50;
    cards += `<rect x="${p.x}" y="${p.y}" width="${w}" height="${h}" rx="6" fill="rgba(20,20,24,0.92)" stroke="rgba(255,59,59,0.35)" stroke-width="1"/>`;
    cards += `<rect x="${p.x + 8}" y="${p.y + 10}" width="${30 + rand() * 50}" height="4" fill="rgba(255,255,255,0.5)" rx="2"/>`;
    cards += `<rect x="${p.x + 8}" y="${p.y + 22}" width="${20 + rand() * 60}" height="3" fill="rgba(255,255,255,0.3)" rx="1.5"/>`;
    cards += `<rect x="${p.x + 8}" y="${p.y + 32}" width="${20 + rand() * 50}" height="3" fill="rgba(255,255,255,0.3)" rx="1.5"/>`;
    cards += `<circle cx="${p.x + w - 12}" cy="${p.y + 12}" r="3" fill="#ff5a5a"/>`;
  }

  // Right: cluster of chat bubbles
  const clusterCx = W - 320;
  const clusterCy = H / 2;
  let bubbles = '';
  type Bubble = { x: number; y: number; w: number; h: number; warm: boolean };
  const bs: Bubble[] = [
    { x: clusterCx - 90, y: clusterCy - 130, w: 180, h: 64, warm: false },
    { x: clusterCx - 60, y: clusterCy - 50, w: 220, h: 70, warm: true },
    { x: clusterCx - 90, y: clusterCy + 38, w: 200, h: 60, warm: false },
    { x: clusterCx + 5, y: clusterCy + 110, w: 150, h: 54, warm: false },
  ];
  for (const b of bs) {
    const accent = b.warm ? 'rgba(255,59,59,0.55)' : 'rgba(255,255,255,0.3)';
    const fill = b.warm ? 'rgba(255,59,59,0.18)' : 'rgba(255,255,255,0.05)';
    bubbles += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.h/2}" fill="${fill}" stroke="${accent}" stroke-width="1"/>`;
    // text lines (non-readable)
    bubbles += `<rect x="${b.x + 18}" y="${b.y + b.h/2 - 6}" width="${(b.w - 60) * (0.5 + rand() * 0.4)}" height="4" fill="${accent}" rx="2"/>`;
    bubbles += `<rect x="${b.x + 18}" y="${b.y + b.h/2 + 4}" width="${(b.w - 80) * (0.4 + rand() * 0.4)}" height="3" fill="${accent}" opacity="0.7" rx="1.5"/>`;
    // small status dot
    bubbles += `<circle cx="${b.x + b.w - 16}" cy="${b.y + 14}" r="3" fill="#7dd3fc" opacity="0.8"/>`;
  }

  // Connector: ring → chat cluster
  const flow = `
    <line x1="${personCx + 200}" y1="${personCy}" x2="${clusterCx - 100}" y2="${clusterCy}" stroke="rgba(255,59,59,0.45)" stroke-width="2" stroke-dasharray="8 8"/>
    <polygon points="${clusterCx - 110},${clusterCy - 6} ${clusterCx - 96},${clusterCy} ${clusterCx - 110},${clusterCy + 6}" fill="#ff3b3b"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    ${backdrop(rand)}
    ${rings}
    ${head}
    ${cards}
    ${flow}
    ${bubbles}
  </svg>`;
}

/* ─────────────────────── orchestration ───────────────────────── */

interface CoverSpec {
  slug: string;
  fileSlug: string;
  render: (seed: number) => string;
}

const SPECS: CoverSpec[] = [
  { slug: 'n8n-stripe-paid-invoices-to-sheets', fileSlug: 'cover-stripe-to-sheets', render: svgStripeToSheets },
  { slug: 'n8n-rss-ai-summary-to-wordpress',    fileSlug: 'cover-rss-to-wordpress',  render: svgRssToWordpress },
  { slug: 'n8n-new-lead-enrich-to-slack',       fileSlug: 'cover-lead-to-slack',     render: svgLeadToSlack },
];

function parseSeedFlag(): number {
  const i = process.argv.indexOf('--seed');
  if (i >= 0 && process.argv[i + 1]) {
    const n = Number(process.argv[i + 1]);
    if (Number.isFinite(n)) return n;
  }
  return Math.floor(Math.random() * 1e9);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);
  if (mongoose.connection.name !== 'internetkeeda') {
    throw new Error(
      `Refusing to run: connected to "${mongoose.connection.name}", expected "internetkeeda".`
    );
  }
  console.log(`Connected to prod db "${mongoose.connection.name}". Generating ${SPECS.length} SVG covers…\n`);

  const previewDir = path.resolve('scripts/.preview/covers');
  mkdirSync(previewDir, { recursive: true });

  const seedBase = parseSeedFlag();

  for (let i = 0; i < SPECS.length; i++) {
    const spec = SPECS[i];
    const seed = seedBase + i * 31;
    const svg = spec.render(seed);
    const bytes = Buffer.from(svg, 'utf8');
    console.log(`  ${spec.fileSlug}  seed=${seed}  size=${bytes.length.toLocaleString()}B`);

    const localPath = path.join(previewDir, `${spec.fileSlug}.svg`);
    writeFileSync(localPath, bytes);

    const blob = new Blob([bytes], { type: 'image/svg+xml' });
    const uploaded = await uploadPublicCover(
      blob as unknown as File,
      `${spec.fileSlug}.svg`
    );

    const r = await StoreProduct.updateOne(
      { slug: spec.slug },
      { $set: { coverImageUrl: uploaded.url } }
    );
    if (r.matchedCount === 0) {
      console.warn(`    ⚠ no StoreProduct found for ${spec.slug} on prod`);
    } else {
      console.log(`    uploaded + coverImageUrl set on prod`);
    }
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
