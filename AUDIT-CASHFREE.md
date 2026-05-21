# Audit — Stripe → Cashfree migration

**Date:** 2026-05-21
**Phase A:** strip Stripe + install Cashfree SDK + add new models
**Decision context:** Cashfree replaces Stripe entirely. INR-only for v1. New pricing model (₹499/mo subscription + tiered boosts) supersedes the old `AdvertisingPlan` system.

---

## Files DELETED in Phase A

These touch Stripe directly and have no purpose under the new flow:

| File | Reason |
|---|---|
| `src/app/api/payments/create-session/route.ts` | Stripe checkout session creator |
| `src/app/api/payments/verify-payment/route.ts` | Stripe session verification |
| `src/app/api/payments/webhook/route.ts` | Stripe webhook handler |
| `src/app/api/payments/subscription/route.ts` | Orphan endpoint (no frontend caller per AUDIT-PAYMENTS.md) |
| `src/app/api/payments/plans/route.ts` | Stub returning mock plan data |
| `src/app/api/payments/purchase/route.ts` | Stripe purchase recorder |
| `src/app/api/payments/user-purchases/route.ts` | Read of Stripe-backed AdvertisingPurchase rows |
| `src/app/api/payment-settings/test-stripe/route.ts` | Admin "test Stripe connection" button |
| `src/themes/theme-one/pages/advertise.tsx` | Old /advertise → Stripe checkout flow |
| `src/themes/theme-one/pages/AdvertiseSuccess.tsx` | Success page for old flow |
| `src/themes/theme-one/pages/AdvertiseCancel.tsx` | Cancel page for old flow |
| `src/themes/theme-two/pages/advertise.tsx` | Theme-two equivalents — not used in production but kept tree-clean |
| `src/themes/theme-two/pages/AdvertiseSuccess.tsx` | " |
| `src/themes/theme-two/pages/AdvertiseCancel.tsx` | " |
| `src/app/advertise/page.tsx` + `success/` + `cancel/` | App-router wrappers around the deleted pages |

## Files MODIFIED in Phase A

| File | Change |
|---|---|
| `package.json` | Drop `stripe`, add `cashfree-pg` |
| `src/lib/api/payments.ts` | Strip Stripe hooks; keep file as a stub for upcoming Cashfree hooks |
| `src/app/api/models/PaymentSettings.ts` | Drop Stripe + PayPal config blocks — Cashfree config comes from env, not DB |
| `src/app/api/models/Subscription.ts` | **Replaced** with the spec's schema (planId, billingCycle, nextBillingDate, etc.) |
| `src/app/api/models/Tool.ts` | Add `seededTool`, `listingStatus`, `activeBoosts`, `boostExpiresAt` |
| `src/themes/theme-one/components/Navigation.tsx` | Remove "Advertise" link if present |
| `src/themes/theme-one/components/Footer.tsx` | Remove "Advertise" link if present |

## Files ADDED in Phase A

| File | Purpose |
|---|---|
| `src/lib/cashfree.ts` | Mode-aware SDK wrapper (TEST/PROD) |
| `src/app/api/models/Payment.ts` | New one-time payment record (spec schema) |
| `scripts/migrations/2025-mark-seeded.ts` | One-shot script to flag existing 5,000 tools as `seededTool: true`, `listingStatus: 'free-seeded'` |

## Files LEFT IN PLACE (legacy, deprecated)

These are not used by the new flow but are left to avoid blast-radius beyond payments:

| File | Note |
|---|---|
| `src/app/api/models/AdvertisingPlan.ts` | Empty out Stripe fields, leave model. Admin UI removed in Phase D cleanup |
| `src/app/api/models/AdvertisingPurchase.ts` | Read-only history of old purchases (none in production yet) |
| `src/app/api/advertising-plans/**` | Routes left; no caller after pages deleted |
| `src/app/api/payment-settings/**` | Routes left to avoid breaking imports; configs ignored |
| `src/themes/*/pages/admin/settings/PaymentSettingsPage.tsx` | Will be repurposed for Cashfree settings in Phase D |
| `src/components/admin/advertising/EditAdvertisingPlanDialog.tsx` | Removed in Phase D when admin plan UI is rebuilt |

## Affiliate commission flow

The old Stripe webhook contained affiliate-commission logic (referrer gets % of subscription revenue). This logic is **lifted into the new `cashfree-subscriptions` webhook in Phase C** and a slimmer version in `cashfree-pg` for Phase B (boost purchases also trigger commission). `AffiliateProfile` + `Commission` models are untouched.

## Env vars

Already added in prior turn:

```
CASHFREE_MODE=TEST
CASHFREE_APP_ID=TEST108...
CASHFREE_SECRET_KEY=cfsk_ma_test_...
CASHFREE_WEBHOOK_SECRET=  (filled in after creating webhook in CF dashboard)
PRICING=default
SEEDED_TOOLS=grandfather free
WHO_CAN_SUBMIT=anyone
```

Stripe env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_*_PRICE_*`) are left in `.env.local`/`.env.example` for now — they become dead config after this commit and can be removed in Phase E cleanup.
