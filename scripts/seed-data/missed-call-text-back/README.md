# Missed-Call Text-Back (n8n)

Turns every unanswered business call into a captured lead. When a call goes unanswered, this
workflow instantly texts the caller back ("Sorry we missed you…"), logs the missed call for
follow-up, and optionally emails you to call back. It's the DIY version of a paid SaaS feature.

**In the zip:** `workflow.json` (import this into n8n) + this guide.

---

## What it does

```
Twilio Call Webhook → Was Call Missed? → Format Call → Text Caller Back → Log Missed Call → Notify You
   (webhook)            (IF)               (Set)         (Twilio SMS)        (Google Sheets)   (Gmail)
                          └─ answered ─► (stops, does nothing)
```

| Node | What it does |
|------|--------------|
| **Twilio Call Webhook** | Receives Twilio's call-status callback and returns `200` immediately. |
| **Was Call Missed?** | Passes **only** terminal *missed* statuses; answered calls dead-end and nothing happens. |
| **Format Call** | Normalizes `caller`, `calledNumber`, `status`, `callSid` so downstream nodes stay clean. |
| **Text Caller Back** | Texts the caller from your Twilio number. Keeps going on a send failure so logging/notify still run. |
| **Log Missed Call** | Appends `Time \| Caller Number \| Status` — your follow-up call list. |
| **Notify You** (optional) | Emails you to call back. Delete it if you don't want it. |

---

## Before you start — accounts you'll need (all free to start)

- **n8n** — cloud or self-hosted.
- **Twilio** — the phone number customers call, with SMS enabled (it sends the text-back).
- **Google account** — for the Google Sheet (and the optional owner email).

---

## Setup (about 20 minutes)

1. **Import** — n8n → **Workflows → Import from File** → pick `workflow.json`.
2. **Connect your credentials** (table below). The connected nodes show "credential not found"
   on import — expected; it clears when you attach your own.
3. **Webhook URL** — activate the workflow, open *Twilio Call Webhook*, copy the **Production URL**
   (you'll wire it into Twilio in the next section).
4. **Text Caller Back** — set Twilio credentials, your **From** number (full international, e.g.
   `+14155550100`), and the **Message** (change `[Business Name]`).
5. **Log Missed Call** — set **Document** = your Sheet, **Sheet** = tab (default `Missed Calls`).
   Add header row 1: `Time | Caller Number | Status`.
6. **Notify You** — set **To**, or delete the node.
7. **Activate** and place a test call you don't answer.

> **Power move:** set the SMS **From** to `={{ $('Format Call').item.json.calledNumber }}` to
> auto-reply from whichever of your Twilio numbers the caller actually dialled.

### Credentials

| Node | Credential type | Where to get it |
|------|-----------------|-----------------|
| Text Caller Back | `twilioApi` | Twilio Console → **Account → API keys & tokens** (Account SID + Auth Token). |
| Log Missed Call | `googleSheetsOAuth2Api` | n8n → *Credentials → New → Google Sheets OAuth2 API* → sign in with Google. |
| Notify You | `gmailOAuth2` | Same Google account → *Credentials → New → Gmail OAuth2*. (Optional node.) |

All credential references are empty `REPLACE_WITH_*` placeholders — **no secrets ship in this
workflow**.

---

## ⭐ The #1 setup step — wiring Twilio (read this carefully)

Twilio does **not** report missed calls anywhere by default. You must (a) route the call somewhere
so it can actually ring and go unanswered, and (b) point the status callback at your webhook URL.

**Twilio Console → Phone Numbers → Manage → Active numbers → your number → Voice Configuration:**

1. **"A call comes in"** must route the call somewhere so it rings and then goes unanswered —
   for example a **TwiML Bin** containing
   `<Response><Dial timeout="20">+1YOURCELL</Dial></Response>` (rings your real phone, then gives
   up), a **Forward to a phone number**, or a voicemail handler.
   *If this is empty/broken the call fails instantly and no useful status is reported — and the
   text-back never fires. This is the mistake that makes people think it "doesn't work."*
2. Scroll to **"Call status changes"** (the status-callback URL) → set method to **HTTP POST** and
   paste the webhook node's **Production URL** → **Save**.

### Which statuses count as "missed"

The IF node forwards a call when its status is one of:

| Status | Meaning | Action |
|--------|---------|--------|
| `no-answer` | Rang, nobody picked up | ✅ text back |
| `busy` | Line busy | ✅ text back |
| `failed` | Call couldn't complete | ✅ text back |
| `canceled` | Caller hung up before connect | ✅ text back |
| `completed` | Answered | ❌ ignored |
| `ringing` / `in-progress` / `queued` | Mid-call transitions | ❌ ignored |

**No duplicate texts:** Twilio fires status callbacks several times per call, but the four matched
statuses are all *terminal* — a single call ends in exactly one — so at most one text is sent.
**One missed call = one text.**

> `completed` covers any answered call, including very short ones. Counting "answered but under N
> seconds" as missed needs `CallDuration` logic via a `<Dial>` action callback — beyond this base
> build; the four statuses above are the clean, reliable signal.

---

## Verify on your instance

- After import, open each node and confirm none are flagged "outdated" for your n8n version. (If
  the IF node is flagged on an older n8n, drop it to `if` v2 — the condition is unchanged.)
- Activate, place a test call you don't answer, and confirm: the execution triggers, the IF node
  takes the *true* branch, you get the text, and a row lands in the Sheet.
- Your Twilio **From** number must be SMS-capable and owned by your account.

---

*This is an importable template you connect to your own n8n, Twilio, and Google accounts — not a
hosted/done-for-you service. Want us to set it up for you? Add **Implementation Support** at
checkout, or reply to your receipt email.*
