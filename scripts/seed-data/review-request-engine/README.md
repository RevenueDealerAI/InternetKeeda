# Review Request Engine (n8n)

Automatically asks every customer for a Google review at the perfect moment — a couple of hours
after the job is done, when they're happiest — with a one-tap direct review link. More reviews →
higher local ranking → more trust → more customers.

**In the zip:** `workflow.json` (import this into n8n) + this guide.

---

## What it does

```
Job Complete Webhook → Capture Customer → Wait 2h → Send Review Request → Log Review Request
   (webhook)             (Set)             (Wait)    (Twilio SMS)          (Google Sheets)
```

| Node | What it does |
|------|--------------|
| **Job Complete Webhook** | Fires when a job/order is marked complete (POST `name`, `phone`, `email`). Returns `200` immediately. |
| **Capture Customer** | Normalizes name / phone (E.164) / email and holds your **reviewLink** config value. |
| **Wait 2 Hours** | Delays the ask so it lands after the experience. Editable amount/unit. |
| **Send Review Request** | Texts the warm ask + your review link. Keeps going on a send failure so logging still runs. |
| **Log Review Request** | **Append-or-Update** (matched on Phone) so nobody is asked twice; leaves a `Reviewed?` column. |

---

## Before you start — accounts you'll need (all free to start)

- **n8n** — cloud or self-hosted. **Note:** the workflow must stay **active** for the 2-hour Wait
  to resume (a manual one-off execution won't survive the pause).
- **Twilio** — an SMS-capable number.
- **Google account** — for the Sheet, and a **Google Business Profile** (that's where the review
  link comes from — see below).

---

## Setup (about 15 minutes)

1. **Import** — n8n → **Workflows → Import from File** → pick `workflow.json`.
2. **Connect your credentials** (table below).
3. **reviewLink** — in *Capture Customer*, paste your Google review short-link (see the next
   section). This is the one variable you set once.
4. **Webhook** — copy the *Job Complete Webhook* Production URL and fire it when a job completes.
5. **Wait 2 Hours** — change amount/unit to taste (e.g. `1` / `days`).
6. **Send Review Request** — Twilio credentials, **From** number (full international), and the
   message text (change `[Business]`).
7. **Log Review Request** — **Document** = your Sheet, **Sheet** = tab (`Review Requests`). Add
   header row 1: `Phone | Name | Email | Requested At | Status | Reviewed?`.
8. **Activate** the workflow.

### Credentials

| Node | Credential type | Where to get it |
|------|-----------------|-----------------|
| Send Review Request | `twilioApi` | Twilio Console → **Account → API keys & tokens**. |
| Log Review Request | `googleSheetsOAuth2Api` | n8n → *Credentials → New → Google Sheets OAuth2 API*. |

All credential references are empty `REPLACE_WITH_*` placeholders — **no secrets ship in this
workflow**.

---

## 🔑 Getting your Google review short-link (`g.page/r/…`)

This is the link that opens the review box in one tap. Get it once and paste it into **reviewLink**.

**Easiest (from Google Search):**
1. Google your exact business name so your Business Profile panel shows.
2. Click **"Ask for reviews"** (sometimes **"Get more reviews"**).
3. Google shows a short link like `https://g.page/r/AbC123XyZ/review` — copy it.

**From Google Business Profile:** go to **business.google.com**, sign in as the owner, open your
profile → **"Get more reviews" / "Share review form"**, and copy the link.

**No profile yet?** Create/claim it at business.google.com first (verification can take a few
days). No profile = no review link.

> **Tip:** make sure the link ends in `/review` so it lands directly on the star-rating box.

---

## Optional tweaks

- **Trigger from a spreadsheet instead of a webhook** — if you mark jobs done in a sheet, delete
  *Job Complete Webhook*, add a **Google Sheets Trigger** (*On Row Added/Updated*) pointed at your
  "Completed" tab, connect it to *Capture Customer*, and change the field reads from
  `$json.body.name` to your column names (e.g. `={{ $json['Customer Name'] }}`). Everything
  downstream is unchanged.
- **Never ask twice, taken further** — the log already upserts on Phone. To also *skip* customers
  who already reviewed, add an **IF** before the SMS that looks the phone up and only proceeds when
  `Reviewed?` is empty.

---

## Verify on your instance

- After import, confirm no node is flagged "outdated" for your n8n version.
- **Activate** the workflow (Wait nodes only resume when active).
- Fire the webhook (optionally shorten Wait to 1 minute to test fast) and confirm the SMS arrives
  with the live link and a row lands in the Sheet.
- Your Twilio **From** number must be SMS-capable and owned by your account.

---

*This is an importable template you connect to your own n8n, Twilio, and Google accounts — not a
hosted/done-for-you service. Want us to set it up for you? Add **Implementation Support** at
checkout, or reply to your receipt email.*
