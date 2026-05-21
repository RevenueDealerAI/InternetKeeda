# Payment go-live — Cashfree TEST → PROD

**Owner:** ai@revenuedealer.com
**Last updated:** 2026-05-21
**Applies to:** Boost flow (Phase B, commit `e81eb23`) and Subscription flow (Phase C — fill in commit when shipped)

This is the actual switchover checklist for flipping internetkeeda.com from Cashfree sandbox to live payments. Work top to bottom; tick boxes as you go. Anything marked **(blocking)** stops the launch — don't skip.

---

## 0. Pre-flight (do this once, not on switchover day)

These take days, not minutes — start the moment you've decided to go live.

- [ ] **Cashfree KYC complete** *(blocking)* — Cashfree won't issue Production keys until KYC is approved. Dashboard: `https://merchant.cashfree.com/merchants/onboarding`. You'll need:
  - PAN of the entity (proprietorship / company)
  - GST (if registered)
  - Cancelled cheque or bank statement for settlement account
  - Identity proof of the authorised signatory
  - Website verification — Cashfree visits internetkeeda.com to confirm a pricing/products page exists, a refund/cancellation policy is linked from the footer, and contact details are reachable.
- [ ] **Pricing page live** *(blocking for KYC)* — Cashfree requires customers to see prices BEFORE checkout. Currently the boost prices are inside the dashboard modal; that may be acceptable but a public `/pricing` page is safer for KYC review. If they push back, build a static `/pricing` route listing ₹999 / ₹2,499 / ₹4,999 boost tiers and ₹499/mo subscription before resubmitting KYC.
- [ ] **Refund + cancellation policy linked in footer** *(blocking for KYC)* — Cashfree explicitly checks for this. The text doesn't need to be elaborate; one paragraph stating "refunds processed within 5–7 business days at our discretion; subscriptions cancellable any time from the user dashboard" satisfies it. Add to `Footer.tsx` linking to `/refund-policy` and `/cancellation-policy`.
- [ ] **Terms + Privacy already exist** — `/terms` and `/privacy` are in the codebase. Confirm they're reachable from the footer. ✓
- [ ] **MongoDB backup snapshot taken** — Atlas → Backups → Take Snapshot. Tag it `pre-cashfree-prod-cutover-YYYY-MM-DD`. If anything goes sideways in the first 48 hours, this is the rollback point.

---

## 1. Get Production credentials from Cashfree

- [ ] Log in to Cashfree dashboard
- [ ] Switch the top-right toggle from **Test** to **Production**
- [ ] Developers → API Keys → **Generate Production keys** (if not already done)
- [ ] Copy these into a secure local note (NOT into git):
  - `CASHFREE_APP_ID` — looks like `prod_XXXXXXXXXXXXXXXXXX` (no `TEST` prefix)
  - `CASHFREE_SECRET_KEY` — looks like `cfsk_ma_prod_XXXXX_XXXXX`
- [ ] Confirm settlement account is verified (Settings → Settlement → Bank Account). Cashfree won't release captured payments until this is done.

---

## 2. Register Production webhooks

**Cashfree's Test and Production environments are isolated — webhooks registered in Test do not carry over.** You must register them again in Production.

In Cashfree dashboard (Production mode):

- [ ] Developers → Webhooks → Add webhook
- [ ] **Payment Gateway webhook**
  - URL: `https://www.internetkeeda.com/api/webhooks/cashfree-pg`
  - Subscribe to events:
    - `PAYMENT_SUCCESS_WEBHOOK`
    - `PAYMENT_FAILED_WEBHOOK`
    - `PAYMENT_USER_DROPPED_WEBHOOK`
    - `REFUND_SUCCESS_WEBHOOK`
    - `REFUND_FAILED_WEBHOOK`
    - `DISPUTE_CREATED_WEBHOOK`
  - Save → copy the webhook secret displayed (Cashfree shows it once)
- [ ] **Subscription webhook** *(only if Phase C is also going live)*
  - URL: `https://www.internetkeeda.com/api/webhooks/cashfree-subscriptions`
  - Subscribe to events:
    - `SUBSCRIPTION_NEW`
    - `SUBSCRIPTION_ACTIVATED`
    - `SUBSCRIPTION_PAYMENT_SUCCESS`
    - `SUBSCRIPTION_PAYMENT_FAILED`
    - `SUBSCRIPTION_CANCELLED`
    - `SUBSCRIPTION_PAUSED`
    - `SUBSCRIPTION_AUTH_STATUS`
    - `SUBSCRIPTION_CARD_EXPIRY_REMINDER`
  - Save → copy that webhook secret too (it's a separate secret from the PG one)

> **Note:** Our `useCashfreeClient()` uses the SDK's built-in signature verification, which keys off `CASHFREE_SECRET_KEY` — not a separate webhook secret. Store the webhook secrets anyway in case Cashfree changes verification semantics in a future SDK upgrade.

---

## 3. Update Vercel environment variables

Vercel Dashboard → InternetKeeda project → Settings → Environment Variables.

For **each** of these, edit the existing entry (don't add duplicates):

- [ ] `CASHFREE_MODE` → change from `TEST` to `PROD`
- [ ] `CASHFREE_APP_ID` → paste live App ID
- [ ] `CASHFREE_SECRET_KEY` → paste live Secret Key
- [ ] `CASHFREE_WEBHOOK_SECRET` → paste from step 2 (PG webhook secret). If you have separate PG and Subscription secrets, just store the PG one here; subscription verification path uses the same secret today.

> **Apply to:** Production. Leave Preview/Development on TEST so PR previews and `npm run dev` keep hitting sandbox.

- [ ] Confirm these are also set (already done during Phase B sandbox setup):
  - `NEXT_PUBLIC_SITE_URL=https://www.internetkeeda.com`
  - `CRON_SECRET` (existing, non-empty)
  - `MONGODB_URI` (already pointed at production cluster)

---

## 4. Redeploy

Env var changes don't apply to running builds. Trigger a fresh deploy:

- [ ] Vercel Dashboard → Deployments → click the latest production deployment → **Redeploy** (uncheck "Use existing build cache" the first time to be safe)
- [ ] Wait for the deploy to go green
- [ ] Spot-check the live site loads: `https://www.internetkeeda.com/`

---

## 5. Verify the switch took effect (read-only checks)

These confirm prod keys are wired without taking a real payment.

- [ ] `curl -s https://www.internetkeeda.com/api/cron/expire-boosts?key=WRONG` → should return `{"error":"Unauthorized"}` (sanity check on cron auth)
- [ ] Open `https://www.internetkeeda.com/submit-tool` while signed in → submit a junk test tool. Confirm it appears in `/dashboard` → My Tools.
- [ ] Open the boost modal but **don't click Pay yet.** Click Pay → confirm the Cashfree hosted checkout URL contains `payments.cashfree.com` (production) and NOT `payments-test.cashfree.com` / `sandbox.cashfree.com`. **If you still see sandbox URLs, your `CASHFREE_MODE` env var didn't apply — re-check step 3.**

---

## 6. Smoke test — ₹1 transaction

You CANNOT change a boost price to ₹1 from the UI (prices are hardcoded in `src/lib/cashfree.ts PRICING`). Two options:

**Option A (cleanest):** temporarily edit `src/lib/cashfree.ts` to set `BOOST_CATEGORY_TOP.paise = 100` (₹1), commit + push to a feature branch deployed via Vercel preview, run the test against the preview URL, then revert. The preview deploy still hits production Cashfree because env vars apply to Production by default unless you set Preview-specific overrides — which means a real ₹1 will actually be charged.

**Option B (faster):** skip the ₹1 smoke and just do the real ₹999 boost on a tool you own. You'll refund yourself in step 7.

Either way:

- [ ] Sign in as yourself
- [ ] Submit a test tool (or use your existing test tool)
- [ ] Boost it. **Use a real card you control, not a sandbox card.**
- [ ] Cashfree captures → you land on `/payment/return` → page polls and flips to "Boost activated" within ~10 seconds.
- [ ] Check `https://www.internetkeeda.com/dashboard` — the boost shows on your test tool.
- [ ] Check Cashfree dashboard → Orders — the transaction is listed with status `PAID`.

If any of those fail, **STOP** — do not proceed to step 7. Check Vercel logs (`vercel logs --since 5m` or via dashboard) for webhook errors, signature failures, etc.

---

## 7. Refund yourself (test the refund path too)

While the test transaction is fresh, exercise the refund admin endpoint:

- [ ] You need to be signed in as an admin (Clerk publicMetadata.role === `admin` or `superadmin`). Confirm via Clerk dashboard if unsure.
- [ ] Find the Payment row ID — easiest is to query directly: `db.payments.findOne({status:'success'}).sort({createdAt:-1})._id`
- [ ] `curl -X POST -H "Cookie: __session=..." https://www.internetkeeda.com/api/admin/payments/{id}/refund` (or build a tiny admin button if you prefer; the route exists, the UI doesn't yet — that's Phase D)
- [ ] Within a minute the webhook fires `REFUND_SUCCESS_WEBHOOK`, the Payment row flips to `refunded`, and the boost slot is pulled off the Tool.
- [ ] Cashfree dashboard → Refunds — confirm the refund is `SUCCESS`. Indian banking sometimes takes T+3 days for the actual money to land back on the card; the row status flipping is the signal that the API call worked.

---

## 8. Monitor the first 10 real transactions

Once Phase B is live and a real merchant has paid:

- [ ] Set a recurring reminder for the first 24 hours to spot-check Cashfree dashboard every couple hours
- [ ] Watch for any webhook delivery failures (Cashfree dashboard → Webhooks → Deliveries → look for 4xx/5xx)
- [ ] If you see PaymentRow.status stuck at `pending` more than 5 minutes after the user paid:
  - Webhook didn't land or failed verification
  - Check `vercel logs --filter cashfree-pg` for signature errors
  - Hit `/api/payments/status?orderId=...` while signed in as the user — it pokes Cashfree directly and may resync

- [ ] Track these KPIs manually for the first week:
  - Total revenue (₹) — sum of successful Payment.amount, divided by 100
  - Boost-to-tool ratio — how many user-owned tools have at least one active boost
  - Refund rate — refunded / (success + refunded)
  - Webhook failure rate — should be 0 in steady state

---

## 9. Cashfree settlement expectations

You will not see money in your bank account the same day:

- Standard settlement cycle in India: **T+1 working day** for most payment methods (card, UPI, netbanking)
- For some methods (international cards, certain wallets) it's T+2 or T+3
- Cashfree's settlement report is in their dashboard → Settlements
- Reconciliation: download the daily settlement CSV from Cashfree, match against our `Payment` collection. There is currently **no automated reconciliation** — the admin dashboard in Phase D will surface this.

---

## 10. Rollback procedure

If something is broken in production and you need to revert to TEST keys:

1. Vercel → env vars → flip `CASHFREE_MODE` back to `TEST` and restore the test `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` (keep these in a secure note)
2. Redeploy
3. Any captured payments stay captured in Cashfree Production — they don't get cancelled by the env flip. The frontend will start hitting the sandbox URL on subsequent attempts.
4. Decide whether to refund all live transactions taken so far (use `/api/admin/payments/[id]/refund` — Phase D will add a bulk refund button)
5. Investigate root cause, fix, then redo the go-live from step 5.

> Rollback is destructive to revenue. Only do this if checkout is fundamentally broken (e.g. webhook signature verification rejects valid Cashfree deliveries, or payments are being captured but boosts aren't being applied).

---

## 11. Post-cutover cleanup (low priority)

These are nice-to-have, not blockers:

- [ ] Remove sandbox `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` from local `.env.local` once you're confident production is stable (or move them under `CASHFREE_APP_ID_TEST` aliases for `npm run dev`)
- [ ] Update `AUDIT-PAYMENTS.md` with a "Cashfree live since YYYY-MM-DD" note
- [ ] Delete the dormant `STRIPE_*` env vars from `.env.local`, `.env.example`, and Vercel — they've been dead since Phase A but still occupy mental space
- [ ] Phase D ships the admin revenue dashboard. Once that's live, drop the manual KPI tracking from step 8.

---

## Appendix — useful one-liners

```bash
# Tail webhook errors from Vercel
vercel logs --filter "cashfree-pg" --since 1h

# Count successful payments today (run from a machine with mongosh)
mongosh "$MONGODB_URI" --eval '
  db.payments.countDocuments({
    status: "success",
    paidAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
  })
'

# Sum revenue today in rupees
mongosh "$MONGODB_URI" --eval '
  db.payments.aggregate([
    { $match: { status: "success", paidAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
    { $group: { _id: null, totalPaise: { $sum: "$amount" } } },
    { $project: { rupees: { $divide: ["$totalPaise", 100] }, _id: 0 } }
  ]).toArray()
'

# Find payments stuck pending > 10 minutes (potential webhook misses)
mongosh "$MONGODB_URI" --eval '
  db.payments.find({
    status: "pending",
    createdAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) }
  }, { orderId: 1, amount: 1, createdAt: 1, userId: 1 })
'

# Manually trigger the expire-boosts cron
curl "https://www.internetkeeda.com/api/cron/expire-boosts?key=$CRON_SECRET"
```

---

## Sign-off

When you've ticked everything above and the first 10 real transactions have all gone through cleanly:

- [ ] Update `AUDIT-PAYMENTS.md` → add a "## Live status" section with the go-live date
- [ ] Tell the team in whichever channel matters
- [ ] Consider Phase D (admin dashboard) the next priority — manual reconciliation gets old fast
