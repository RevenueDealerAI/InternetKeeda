# Lead Instant Reply (n8n)

Texts every new website lead back in **seconds**, saves the lead to a Google Sheet, and emails
you to follow up while the lead is still warm. Runs 24/7 — you never drop a lead again.

**In the zip:** `workflow.json` (import this into n8n) + this guide.

---

## What it does

```
Lead Webhook → Format Lead → Save Lead to Sheet → Send Auto-Reply SMS → Notify You
 (webhook)      (Set)          (Google Sheets)       (Twilio SMS)         (Gmail)
```

| Node | What it does |
|------|--------------|
| **Lead Webhook** | Receives your website form's POST and responds `200` instantly, so the visitor's form never hangs. |
| **Format Lead** | Normalizes `name / phone / email / message / source` with safe defaults and forces the phone into E.164 (`+<country><number>`) for Twilio. |
| **Save Lead to Sheet** | Appends one clean row (Time, Name, Phone, Email, Message, Source). Runs **before** the SMS so the lead is saved even if the text fails. |
| **Send Auto-Reply SMS** | Texts the lead a personalized auto-reply. Set to keep going on a bad number, so the owner alert still fires. |
| **Notify You** | Emails you the full lead so a human can call back fast. |

The order — **save → text → notify** — is deliberate: the Sheet row is your durable record and
comes first, so nothing is ever lost even if Twilio or email errors out.

---

## Before you start — accounts you'll need (all free to start)

- **n8n** — cloud or self-hosted.
- **Twilio** — an SMS-capable phone number (this is what texts the lead back).
- **Google account** — for the Google Sheet and the owner email (Gmail).

---

## Setup (about 15 minutes)

1. **Import** — n8n → **Workflows → Import from File** → pick `workflow.json`.
2. **Connect your credentials** (see table below). On import the three connected nodes show
   "credential not found" — that's expected; it clears the moment you attach your own.
3. **Webhook URL** — activate the workflow, open *Lead Webhook*, copy the **Production URL**, and
   paste it into your website form's action / webhook / integration field.
4. **Google Sheet** — in *Save Lead to Sheet* set **Document** = your Sheet and **Sheet** = the tab
   (default `Leads`). Add this header row: `Time | Name | Phone | Email | Message | Source`.
5. **Twilio number** — in *Send Auto-Reply SMS* set your purchased **From** number in full
   international format (e.g. `+14155550100`).
6. **Reply message** — *Send Auto-Reply SMS* → the **Message** field. Change `[Business Name]` to
   your business. Keep `{{ $('Format Lead').item.json.name }}` so it stays personalized.
7. **Owner alert** — *Notify You* → connect an email account and set **To**.
8. **Activate** (top-right toggle) and submit a test lead from your form.

> **Phone country code:** the default is `1` (US/Canada). If your leads are elsewhere, change
> `defaultCountryCode` inside the *Format Lead* phone expression.

### Credentials

| Node | Credential type | Where to get it |
|------|-----------------|-----------------|
| Save Lead to Sheet | `googleSheetsOAuth2Api` | n8n → *Credentials → New → Google Sheets OAuth2 API* → sign in with Google. |
| Send Auto-Reply SMS | `twilioApi` | Twilio Console → **Account → API keys & tokens** (Account SID + Auth Token). |
| Notify You | `gmailOAuth2` | Same Google account → *Credentials → New → Gmail OAuth2*. |

All credential references in the file are empty `REPLACE_WITH_*` placeholders — **no secrets ship
in this workflow**. Nothing transmits until you attach your own accounts.

---

## Optional: alert to Slack instead of email

Prefer Slack over email for the owner alert? Delete *Notify You*, drop in a **Slack → Send
Message** node, connect *Send Auto-Reply SMS → Slack*, and reuse the same
`{{ $('Format Lead').item.json.* }}` fields in the message. (There's a sticky note on the canvas
reminding you of this.)

---

## Good to know

- Downstream nodes read lead fields via `$('Format Lead').item.json.*` (not `$json`) because the
  Sheets node overwrites `$json` — so your SMS and email always pull clean lead data.
- *Format Lead* reads `body`, then `query`, then root, so it works with JSON posts, standard
  `application/x-www-form-urlencoded` form posts, and query-string posts alike.
- Missing fields get safe defaults: name → `there`, message → `(no message provided)`,
  source → `Website form`.

## Verify on your instance

- After import, open each node and confirm none show an "outdated" badge for your n8n version.
- Activate, submit a real test lead, and confirm: a row lands in the Sheet, the lead gets the
  text, and you get the notification email.
- Your Twilio **From** number must be SMS-capable and owned by your account.

---

*This is an importable template you connect to your own n8n, Twilio, and Google accounts — not a
hosted/done-for-you service. Want us to set it up for you? Add **Implementation Support** at
checkout, or reply to your receipt email.*
