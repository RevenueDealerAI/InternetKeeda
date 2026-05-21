# Audit — Original CodeCanyon vs Current InternetKeeda

**Date:** 2026-05-21
**Original source:** `extracted/main_files/` (CodeCanyon item V4oAF5U6 — WebBuddyLLC "AI Tools Finder")
**Current source:** `src/` on `main` at commit `d00d3fa`
**Scope:** Inventory only. No code changes recommended for immediate execution; this is for monetisation planning.

---

## Headline finding

The original script already shipped a working **Stripe-based "Advertise" payment flow** (one-time payments for featured listings + an `Advertise` page + an admin plan manager + an affiliate-commission webhook). All of it is **active in the current build**. What it does **not** ship is:

- Subscription/recurring billing surface (the `Subscription` model is written by the webhook but never read — orphan)
- PayPal (UI + schema only — no SDK installed)
- **Any email-sending infrastructure at all** (no nodemailer/resend/sendgrid/mailgun in either tree)
- Cron beyond the existing tool-scraper
- Coupons, refund issuance UI, invoice PDFs, payment reconciliation dashboard

No additional payment features were stripped during our work — original and current dependency lists are effectively identical (we only added `@next/bundle-analyzer` and `lighthouse` for dev tooling).

---

## A. Routes

| Route | Original | Current | Status |
|---|---|---|---|
| `/advertise` + `/advertise/success` + `/advertise/cancel` | ✓ | ✓ | **Active.** `useCreatePaymentSession` hits Stripe |
| `/dashboard/affiliate` | ✓ | ✓ | Active |
| `/admin/payment-settings` | ✓ | ✓ | Active — reads/writes `PaymentSettings` |
| `/admin/advertising-plans` | ✓ | ✓ | Active — plan CRUD |
| `/api/payments/create-session` | ✓ | ✓ | Active (Stripe live; PayPal stub) |
| `/api/payments/verify-payment` | ✓ | ✓ | Active |
| `/api/payments/webhook` | ✓ | ✓ | Active — Stripe events create Subscription + Commission rows |
| `/api/payments/subscription` | ✓ | ✓ | **Orphaned — no frontend caller** (verified: zero matches for `payments/subscription` in `src/`) |
| `/api/payments/plans` | ✓ | ✓ | Stub returning mock data |
| `/pricing`, `/plans`, `/membership`, `/subscription` (user-facing) | ✗ | ✗ | Never existed in original |

---

## B. Database models

| Model | Original | Current | Status |
|---|---|---|---|
| `AdvertisingPlan` | ✓ | ✓ | Active — admin CRUD |
| `AdvertisingPurchase` | ✓ | ✓ | Active — written on every successful payment; acts as the order/invoice record |
| `Subscription` | ✓ | ✓ | **Write-only.** Webhook inserts; no read path |
| `PaymentSettings` | ✓ | ✓ | Active — Stripe + PayPal config fields |
| `AffiliateProfile` | ✓ | ✓ | Active |
| `Commission` | ✓ | ✓ | Active — written on purchase |
| `Payout` | ✓ | ✓ | Present — no automation, manual admin trigger only |
| `NewsletterSubscription` | ✓ | ✓ | Model + CRUD routes exist; **no sending logic** |
| `Order`, `Invoice`, `Coupon`, `Referral`, `Wallet`, `Transaction` | ✗ | ✗ | Never existed |

---

## C. UI components

No orphaned UI components found. Every payment/advertising/admin component shipped in the original is imported by an active page. Nothing to clean up; nothing dormant to enable.

---

## D. Payment integrations

| Provider | Package installed | Wired | Notes |
|---|---|---|---|
| **Stripe** | `stripe@14.18.0` | ✓ | Full path: session → checkout → webhook → Subscription + Commission. Working in production. |
| **PayPal** | None | ✗ | 25 source files reference PayPal (UI dropdowns, schema fields, validation), but **no PayPal SDK is in `package.json`**. `create-session` returns a placeholder URL when PayPal is selected; no webhook handler. **Customer-facing risk:** if an admin enables PayPal in settings, checkout silently breaks |
| Razorpay, Cashfree, Paddle, Lemon Squeezy, CCAvenue, PayU, Instamojo, PhonePe | None | ✗ | Never existed |

---

## E. Admin features

| Feature | Original | Current | Notes |
|---|---|---|---|
| Advertising plan CRUD | ✓ | ✓ | Active |
| Payment settings (Stripe/PayPal config) | ✓ | ✓ | Active |
| Affiliate balance view | ✓ | ✓ | Active |
| Refund issuance | ✗ UI | ✗ UI | `status: 'refunded'` is in schema but no admin button or `/api/.../refund` route |
| Subscription dashboard | ✗ | ✗ | Even though Subscription rows are being written, there is no admin view listing them |
| Coupon system | ✗ | ✗ | Not in original |
| Payment reconciliation / revenue dashboard | ✗ | ✗ | Admin dashboard shows tool stats, not revenue |
| Webhook event log | ✗ | ✗ | No way to inspect Stripe deliveries/retries in-app |

---

## F. Email templates

**Nothing exists in either tree.** Verified: zero matches for `nodemailer`, `resend`, `sendgrid`, `mailgun`, `@brevo`, `postmark` in `package.json`.

| Event | Currently sent? |
|---|---|
| Auth (welcome, verify, password reset) | Clerk handles — no custom templates needed |
| Payment confirmation | **No** |
| Subscription renewal reminder | **No** |
| Affiliate payout notification | **No** |
| Tool approval / rejection notice to submitter | **No** |
| Newsletter digest (despite the model existing) | **No** |
| Admin alert on failed payment | **No** |

This is the biggest gap in the original. If monetisation matters, an email path is the first dependency you'd add.

---

## G. Cron jobs / scheduled tasks

| Job | Wired |
|---|---|
| `/api/cron/scrape` — pulls new AI tools | ✓ (external trigger) |
| Subscription expiry warnings | ✗ |
| Affiliate payout automation | ✗ |
| Newsletter digest | ✗ |
| Failed-payment retry sweep | ✗ |

No cron library is installed (`node-cron`, `agenda`, `bull`, `bullmq` — all absent). Any new cron must run via Vercel Cron / GitHub Actions / external scheduler.

---

## H. Dependency deltas

**In original but not in current:** none (clean inherit).

**In current but not in original:** `@next/bundle-analyzer`, `lighthouse` (dev only).

**Missing libraries that would unlock monetisation surfaces:**

| Need | Library suggestion |
|---|---|
| Transactional email | `resend` (simplest), `nodemailer + SMTP`, or `@sendgrid/mail` |
| PayPal | `@paypal/checkout-server-sdk` |
| Cron in-process | `node-cron` (or just rely on external scheduler) |
| Invoice PDFs | `pdfkit` or `@react-pdf/renderer` |

---

## Monetisation flag summary

Specifically called out by the audit brief:

| Flag | Status |
|---|---|
| **Subscription / recurring billing** | Stripe webhook can create Subscription rows, but there is **no user surface** (no pricing page, no upgrade CTA, no "manage subscription" UI). Wiring the existing orphan `/api/payments/subscription` route + adding a Pricing page is the cheapest route to monthly revenue. |
| **One-time payment for featured listings** | **Already live** at `/advertise`. This is the active monetisation channel. |
| **Pricing pages / plan tables** | None exist user-facing. Admin can manage `AdvertisingPlan` rows but there is no `/pricing` page reading from them. |
| **User dashboard with subscription status** | `/dashboard/affiliate` exists; no subscription view |
| **Admin coupon system** | Not in original. Greenfield if needed. |
| **Email notifications** | **Zero infrastructure.** Highest-leverage missing piece. |

---

## Top recommendations (priority order — not for immediate execution)

1. **Email infrastructure** — install `resend`, send payment confirmation + affiliate payout notice. Largest gap, smallest install.
2. **PayPal decision** — either pull the dangling references out of the settings UI/schema, or actually finish the integration. Today's state risks a confused merchant turning it on and silently breaking checkout.
3. **Subscription user surface** — there's a working Stripe webhook writing `Subscription` rows that no one queries. A simple Pricing page + "manage subscription" panel turns dead code into recurring revenue.
4. **Refund + revenue admin views** — schema already supports `status: 'refunded'`; add the button and a "Revenue this month / pending refunds" card on the admin dashboard.
5. **Affiliate payout cron** — `Payout` model exists, manual only today. A weekly cron + payout email would close the affiliate loop.
6. **Invoice PDF** — `AdvertisingPurchase` is the order record but customers can't download an invoice. `pdfkit` + a route gets this in an afternoon.

---

## Notes on confidence

- Subagent (Explore) did the deep sweep; spot-checked three claims directly:
  - `payments/subscription` callers: **0 found** (confirmed orphan)
  - Email libraries in `package.json`: **0 hits** (confirmed gap)
  - PayPal SDK in `package.json`: **0 hits** but 25 source-file references (confirmed UI/schema scaffolding)
- The "no orphaned UI components" claim was not exhaustively verified; if you're planning to clean up dead code, do a separate sweep before deleting.
