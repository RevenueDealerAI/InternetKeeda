/**
 * Transactional email delivery for Keeda Labs purchases.
 *
 * Single dependency: Resend. We chose it because:
 *   - One env var (RESEND_API_KEY)
 *   - Domain verification via DNS, then any from-address on that
 *     domain works (we use noreply@internetkeeda.com)
 *   - Generous free tier — plenty for store launch volume
 *
 * The mailer is FAILURE-SAFE BY CONTRACT. sendDeliveryEmail() never
 * throws. The worst case is a logged warning and an empty result
 * object; the buyer can always re-download from /store/my-downloads
 * because the StorePurchase entitlement was minted before the email
 * was fired.
 *
 * Renderer is kept separate from sender so the email can be unit-
 * tested + previewed without hitting Resend or needing a network.
 */

import { Resend } from 'resend';
import { STORE_BRAND } from '../config';
import { formatPrice } from './pricing';
import type { StoreCurrency } from '../config';

const FROM_ADDRESS = `${STORE_BRAND.name} <labs@internetkeeda.com>`;
const REPLY_TO_ADDRESS = 'hello@internetkeeda.com';
const SETUP_HELP_USD = 99;

/** WhatsApp handle — same one used everywhere (WhatsAppSupportButton,
 *  Footer, AgentSection, KeedaChat allowlist). The CTA in the email
 *  pre-fills a message via the `?text=` param so support knows what
 *  the buyer is asking about before they even type. */
const WHATSAPP_BASE = 'https://wa.me/internetkeeda';

function whatsappHelpUrl(productTitle: string, purchaseId?: string): string {
  const lines = [
    `Hi ${STORE_BRAND.parentName} team,`,
    `I'd like the $${SETUP_HELP_USD} setup help for "${productTitle}".`,
  ];
  if (purchaseId) lines.push(`Order: ${purchaseId}.`);
  lines.push(`Thanks!`);
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export interface DeliveryEmailInput {
  buyerEmail: string;
  buyerName?: string;
  productTitle: string;
  productSlug: string;
  amountPaidMinor: number;
  currency: StoreCurrency;
  /** Absolute base URL (https://internetkeeda.com in prod, etc.).
   *  Required because emails open in foreign inboxes — no relative
   *  URLs survive. */
  baseUrl: string;
  /** Optional purchase id; used in the mailto-help subject so support
   *  can look up the order without asking. */
  purchaseId?: string;
}

export interface DeliverySendResult {
  ok: boolean;
  /** Resend message id if sent, undefined on skip/failure. */
  id?: string;
  /** Why we didn't send. 'no-provider' = RESEND_API_KEY unset (dev
   *  envs); 'no-recipient' = buyerEmail missing/invalid;
   *  'send-failed' = upstream rejected. */
  skipped?: 'no-provider' | 'no-recipient' | 'send-failed';
  error?: string;
}

/* ─────────────────── public surface ─────────────────── */

/** Fire the delivery email. Never throws — returns a result so the
 *  caller can log without try/catch. */
export async function sendDeliveryEmail(
  input: DeliveryEmailInput
): Promise<DeliverySendResult> {
  const recipient = (input.buyerEmail || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    console.warn('[store/mailer] skip: invalid recipient', { recipient });
    return { ok: false, skipped: 'no-recipient' };
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[store/mailer] skip: RESEND_API_KEY not set — buyer must re-download from /store/my-downloads'
    );
    return { ok: false, skipped: 'no-provider' };
  }

  try {
    const html = renderDeliveryEmailHtml(input);
    const text = renderDeliveryEmailText(input);
    const subject = `Your ${STORE_BRAND.name} workflow is ready — ${input.productTitle}`;

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipient,
      replyTo: REPLY_TO_ADDRESS,
      subject,
      html,
      text,
      headers: {
        // Helps gmail/outlook thread + group store transactionals.
        'X-Entity-Ref-ID': `keeda-labs-purchase-${input.purchaseId || 'unknown'}`,
      },
    });

    if (result.error) {
      console.warn('[store/mailer] resend rejected send:', result.error);
      return { ok: false, skipped: 'send-failed', error: String(result.error.message || result.error) };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[store/mailer] send threw:', message);
    return { ok: false, skipped: 'send-failed', error: message };
  }
}

/* ─────────────────── rendering ─────────────────── */

/**
 * Render the delivery email body. Returns a complete HTML document
 * (with table-based layout so it works in Outlook / Gmail / Apple
 * Mail without surprises). Colors mirror the site's design tokens:
 *   bg     #0a0a0c
 *   bg-2   #111114
 *   ink    #f4f3f0
 *   ink-2  rgba(244,243,240,0.75) (#bfbeba flat for email)
 *   accent #ff3b3b
 */
export function renderDeliveryEmailHtml(input: DeliveryEmailInput): string {
  const downloadUrl = `${stripTrailing(input.baseUrl)}/store/my-downloads`;
  const productUrl = `${stripTrailing(input.baseUrl)}/store/${encodeURIComponent(input.productSlug)}`;
  const priceLabel = formatPrice(input.amountPaidMinor, input.currency);
  const greeting = input.buyerName
    ? `Hi ${escapeHtml(input.buyerName)},`
    : 'Hi there,';

  const mailtoSubject = `Workflow setup help — ${input.productTitle} ($${SETUP_HELP_USD})`;
  const mailtoBody =
    `Hi ${STORE_BRAND.parentName} team,\n\n` +
    `I'd like the $${SETUP_HELP_USD} setup help for "${input.productTitle}".\n` +
    (input.purchaseId ? `My order id is ${input.purchaseId}.\n\n` : '\n') +
    `Thanks!`;
  const mailtoHref = `mailto:${REPLY_TO_ADDRESS}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;
  const whatsappHref = whatsappHelpUrl(input.productTitle, input.purchaseId);

  return /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark only">
<meta name="supported-color-schemes" content="dark only">
<title>${escapeHtml(`Your ${STORE_BRAND.name} workflow is ready`)}</title>
<style>
  /* Apple Mail / web clients respect this. Outlook ignores. */
  body, table, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  a { text-decoration: none; }
  @media (max-width: 480px) {
    .container { width: 100% !important; padding: 24px 18px !important; }
    .h1 { font-size: 24px !important; line-height: 1.18 !important; }
    .cta-pill { padding: 14px 22px !important; font-size: 12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#050507;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  ${escapeHtml(`Your ${input.productTitle} download is ready in your Keeda Labs library.`)}
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050507;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px;max-width:600px;background:#0a0a0c;border:1px solid rgba(255,255,255,0.10);border-radius:18px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:28px 36px 0 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:'IBM Plex Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#ff3b3b;">
                  § ${escapeHtml(STORE_BRAND.parentName.toLowerCase())} · ${escapeHtml(STORE_BRAND.name.toLowerCase())}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Confirmation -->
        <tr>
          <td style="padding:18px 36px 8px 36px;">
            <h1 class="h1" style="margin:0;color:#f4f3f0;font-size:30px;line-height:1.1;letter-spacing:-0.025em;font-weight:600;">
              Purchase confirmed.
            </h1>
            <p style="margin:14px 0 0 0;color:rgba(244,243,240,0.78);font-size:15px;line-height:1.65;">
              ${greeting} ${escapeHtml(priceLabel)} captured. Your${' '}
              <strong style="color:#f4f3f0;">${escapeHtml(input.productTitle)}</strong>${' '}
              is ready to download — and yours to keep, lifetime updates included.
            </p>
          </td>
        </tr>

        <!-- Primary CTA -->
        <tr>
          <td align="center" style="padding:28px 36px 4px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="#ff3b3b" style="border-radius:999px;">
                  <a href="${escapeAttr(downloadUrl)}" class="cta-pill"
                     style="display:inline-block;padding:16px 30px;color:#ffffff;font-family:'IBM Plex Mono',Menlo,Consolas,monospace;font-size:12.5px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;border-radius:999px;">
                    Download your workflow →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:14px 0 0 0;color:rgba(244,243,240,0.50);font-size:12px;line-height:1.5;">
              Opens your private library. You can re-download anytime, on any device.
            </p>
          </td>
        </tr>

        <!-- Setup steps -->
        <tr>
          <td style="padding:28px 36px 0 36px;">
            <div style="border-top:1px solid rgba(255,255,255,0.08);"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 36px 0 36px;">
            <div style="font-family:'IBM Plex Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#ff3b3b;margin-bottom:8px;">
              Setup in 5 minutes
            </div>
            <ol style="margin:0;padding:0 0 0 18px;color:rgba(244,243,240,0.82);font-size:14.5px;line-height:1.7;">
              <li>Unzip the download — you'll find <code style="color:#f4f3f0;background:rgba(255,255,255,0.05);padding:1px 6px;border-radius:4px;">workflow.json</code> + <code style="color:#f4f3f0;background:rgba(255,255,255,0.05);padding:1px 6px;border-radius:4px;">README.md</code>.</li>
              <li>Read the README — every step you need, including which credentials to create.</li>
              <li>In n8n, open <em style="color:#f4f3f0;">Workflows → Import from File</em> and pick <code style="color:#f4f3f0;background:rgba(255,255,255,0.05);padding:1px 6px;border-radius:4px;">workflow.json</code>.</li>
              <li>Wire your own credentials into each yellow-pill node — we ship empty credential references on purpose so nothing leaks.</li>
              <li>Replace any <code style="color:#f4f3f0;background:rgba(255,255,255,0.05);padding:1px 6px;border-radius:4px;">REPLACE_WITH_*</code> placeholders (sheet ids, feed URLs, channels), then activate at the top right.</li>
            </ol>
          </td>
        </tr>

        <!-- Setup-help block -->
        <tr>
          <td style="padding:28px 36px 0 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,59,59,0.12);border:1px solid rgba(255,59,59,0.35);border-radius:14px;">
              <tr>
                <td style="padding:22px 24px;">
                  <div style="font-family:'IBM Plex Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#ff3b3b;margin-bottom:6px;">
                    Not feeling techy?
                  </div>
                  <div style="color:#f4f3f0;font-size:16px;line-height:1.4;font-weight:600;letter-spacing:-0.01em;">
                    The ${escapeHtml(STORE_BRAND.parentName)} team will set this up for you — $${SETUP_HELP_USD}.
                  </div>
                  <p style="margin:10px 0 16px 0;color:rgba(244,243,240,0.75);font-size:13.5px;line-height:1.6;">
                    We'll get on a screenshare, wire your credentials, replace placeholders, and watch the first real run land. Tip-to-tip ~30 minutes.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#25D366" style="border-radius:999px;">
                        <a href="${escapeAttr(whatsappHref)}"
                           style="display:inline-block;padding:11px 20px;color:#ffffff;font-family:'IBM Plex Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;border-radius:999px;">
                          Chat on WhatsApp →
                        </a>
                      </td>
                      <td style="width:12px;">&nbsp;</td>
                      <td>
                        <a href="${escapeAttr(mailtoHref)}"
                           style="display:inline-block;padding:11px 20px;color:#f4f3f0;font-family:'IBM Plex Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:600;border:1px solid rgba(255,255,255,0.16);border-radius:999px;background:rgba(255,255,255,0.04);">
                          Or email us
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Receipt -->
        <tr>
          <td style="padding:28px 36px 0 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:'IBM Plex Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(244,243,240,0.50);padding-bottom:6px;">
                  Receipt
                </td>
              </tr>
              <tr>
                <td style="font-family:'IBM Plex Mono',Menlo,Consolas,monospace;font-size:12.5px;color:rgba(244,243,240,0.78);line-height:1.7;">
                  Item &nbsp;·&nbsp; <a href="${escapeAttr(productUrl)}" style="color:#f4f3f0;">${escapeHtml(input.productTitle)}</a><br>
                  Paid &nbsp;·&nbsp; ${escapeHtml(priceLabel)}<br>
                  ${input.purchaseId ? `Order &nbsp;·&nbsp; ${escapeHtml(input.purchaseId)}<br>` : ''}
                  Library &nbsp;·&nbsp; <a href="${escapeAttr(downloadUrl)}" style="color:#ff3b3b;">${escapeHtml(downloadUrl.replace(/^https?:\/\//, ''))}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:36px 36px 30px 36px;">
            <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:18px;">
              <div style="font-family:'IBM Plex Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(244,243,240,0.50);">
                ${escapeHtml(STORE_BRAND.name)} · ${escapeHtml(STORE_BRAND.parentName)}
              </div>
              <div style="margin-top:6px;color:rgba(244,243,240,0.45);font-size:11.5px;line-height:1.6;">
                Operated by Revenue Dealer MarTech Pvt Ltd (India) and Viom Global Inc (USA).<br>
                You're receiving this because you bought a workflow from
                <a href="${escapeAttr(stripTrailing(input.baseUrl) + '/store')}" style="color:rgba(244,243,240,0.60);">internetkeeda.com/store</a>.
                Reply to this email and a human will answer.
              </div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Plain-text fallback. Some mail clients still prefer it; spam
 *  filters definitely do. Same information as the HTML version. */
export function renderDeliveryEmailText(input: DeliveryEmailInput): string {
  const downloadUrl = `${stripTrailing(input.baseUrl)}/store/my-downloads`;
  const priceLabel = formatPrice(input.amountPaidMinor, input.currency);

  return [
    `Purchase confirmed.`,
    ``,
    `${priceLabel} captured. Your "${input.productTitle}" is ready to download — yours to keep, lifetime updates included.`,
    ``,
    `Download your workflow:`,
    `  ${downloadUrl}`,
    ``,
    `Setup in 5 minutes:`,
    `  1. Unzip — you'll find workflow.json + README.md.`,
    `  2. Read the README. It lists every credential you need.`,
    `  3. In n8n: Workflows → Import from File → pick workflow.json.`,
    `  4. Wire your own credentials into each node (we ship empty refs).`,
    `  5. Replace REPLACE_WITH_* placeholders, then activate.`,
    ``,
    `Not feeling techy? The ${STORE_BRAND.parentName} team will set this up for you for $${SETUP_HELP_USD}.`,
    `  WhatsApp:  ${whatsappHelpUrl(input.productTitle, input.purchaseId)}`,
    `  Email:     ${REPLY_TO_ADDRESS}  (subject: "Workflow setup help — ${input.productTitle} ($${SETUP_HELP_USD})")`,
    ``,
    `Receipt`,
    `  Item:    ${input.productTitle}`,
    `  Paid:    ${priceLabel}`,
    input.purchaseId ? `  Order:   ${input.purchaseId}` : '',
    `  Library: ${downloadUrl}`,
    ``,
    `${STORE_BRAND.name} · ${STORE_BRAND.parentName}`,
    `Operated by Revenue Dealer MarTech Pvt Ltd (India) and Viom Global Inc (USA).`,
    `Reply to this email and a human will answer.`,
  ]
    .filter(Boolean)
    .join('\n');
}

/* ─────────────────── helpers ─────────────────── */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}

function stripTrailing(u: string): string {
  return u.replace(/\/+$/, '');
}
