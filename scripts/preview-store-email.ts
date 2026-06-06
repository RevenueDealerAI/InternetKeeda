/**
 * Renders the Keeda Labs delivery email with realistic sample data
 * and writes the HTML to scripts/.preview/store-delivery.html so it
 * can be opened in a browser / Playwright for visual review.
 *
 * Does NOT hit Resend. Pure render — safe to run repeatedly with no
 * env vars set.
 *
 *   npx tsx scripts/preview-store-email.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  renderDeliveryEmailHtml,
  renderDeliveryEmailText,
  type DeliveryEmailInput,
} from '../src/features/store/lib/mailer';

const signedInSample: DeliveryEmailInput = {
  buyerEmail: 'alex@acme.io',
  buyerName: 'Alex',
  productTitle: 'Stripe Paid Invoices → Google Sheets (n8n)',
  productSlug: 'n8n-stripe-paid-invoices-to-sheets',
  amountPaidMinor: 11800, // $118 = $19 base + $99 implementation support
  currency: 'USD',
  baseUrl: 'https://internetkeeda.com',
  purchaseId: '6a210836e7daf493416e4f0e',
  addOnIds: ['implementation-support'],
};

const guestSample: DeliveryEmailInput = {
  ...signedInSample,
  buyerEmail: 'guest@example.com',
  buyerName: 'Jane',
  isGuest: true,
  attachFile: 'https://example.com/fake-blob/workflow.zip',
  attachFileName: 'n8n-stripe-paid-invoices-to-sheets.zip',
  // Drop the add-on for guest preview so we see the plain "Not feeling techy?" branch
  addOnIds: [],
  amountPaidMinor: 4900,
};

const outDir = path.resolve('scripts/.preview');
mkdirSync(outDir, { recursive: true });

for (const [name, sample] of [
  ['signed-in', signedInSample],
  ['guest', guestSample],
] as const) {
  const html = renderDeliveryEmailHtml(sample);
  const text = renderDeliveryEmailText(sample);
  writeFileSync(path.join(outDir, `store-delivery-${name}.html`), html, 'utf8');
  writeFileSync(path.join(outDir, `store-delivery-${name}.txt`), text, 'utf8');
  console.log(
    `wrote ${name}: html=${html.length}b, text=${text.length}b`
  );
}
