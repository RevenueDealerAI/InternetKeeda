# Clerk → Mongo user sync webhook

This webhook upserts a Mongo `User` row whenever Clerk fires
`user.created` or `user.updated`, and deletes it on `user.deleted`.
Without it, fresh sign-ins have no Mongo row, which makes
`/admin/moderation` (and any other code relying on `User.isAdmin`)
look at a missing record.

## One-time setup in the Clerk dashboard

1. Clerk dashboard → your application → **Webhooks** → **Add Endpoint**
2. **Endpoint URL:** `https://www.internetkeeda.com/api/webhooks/clerk`
3. **Subscribe to events:** `user.created`, `user.updated`, `user.deleted`
4. Click **Create** — Clerk shows the **Signing Secret** (starts with `whsec_…`). Copy it.
5. Vercel → InternetKeeda project → **Settings → Environment Variables** → add:
   - Key: `CLERK_WEBHOOK_SECRET`
   - Value: (paste the `whsec_…` value)
   - Environments: Production (and Preview if you want sign-ups in PR previews to sync)
6. Redeploy so the new env var is active.

## Verification after setup

1. Sign up a fresh test account on the live site.
2. Vercel logs → look for `[clerk-webhook]` entries — should see a
   200 response. No `signature verification failed` warnings.
3. MongoDB Atlas → `users` collection → confirm a new row exists with
   the right `clerkId` + email.

If the row doesn't appear, check:
- `CLERK_WEBHOOK_SECRET` is set (the route refuses all events if it
  isn't — and logs `CLERK_WEBHOOK_SECRET is not set` to Vercel).
- The webhook URL in Clerk matches exactly — `https://www.internetkeeda.com`
  with the `www`, not the bare apex.
- Clerk's "Recent Deliveries" tab shows 200 (not 401 / 5xx).

## Admin elevation

The webhook auto-promotes any user whose primary email ends in
`@internetkeeda.com` to `isAdmin: true` in Mongo and `role: "admin"`
in Clerk `publicMetadata`. Add other domains to the
`ADMIN_EMAIL_DOMAINS` array in the route if needed.

For one-off admin grants that don't match the domain rule, use:

```
ADMIN_EMAIL=someone@example.com npx tsx scripts/seed-admin.ts
```
