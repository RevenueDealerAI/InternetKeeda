# RSS → AI Draft (Review Only) (n8n)

A safe, single-site auto-blogging assistant. It watches the RSS feeds you choose; when something
new appears, Claude drafts an original post about it and drops it into a **review** sheet. It
**never auto-publishes** — a human approves and posts. The speed of AI drafting, none of the risk
of garbage going live.

**In the zip:** `workflow.json` (import this into n8n) + this guide.

---

## What it does

```
Watch RSS Feed → Dedupe New Items → Draft Post (Claude) → Parse Draft → Save Draft (Review Only)
   (RSS trigger)   (Code)            (HTTP → Anthropic)    (Code)        (Google Sheets, Status = NEEDS REVIEW)
```

| Node | What it does |
|------|--------------|
| **Watch RSS Feed** | Polls one feed URL on a schedule; emits items newer than the last poll. |
| **Dedupe New Items** | Second-layer dedupe against the workflow's static data; passes only never-seen items. |
| **Draft Post (Claude)** | Anthropic Messages API; drafts an **original** title + body in your voice. Key as credential. |
| **Parse Draft** | Robustly parses the model's JSON (handles code-fences and fallbacks) into title + body. |
| **Save Draft (Review Only)** | Appends Date, Source, Suggested Title, Draft Body, **Status = NEEDS REVIEW**. |

---

## 🛑 Review-only BY DESIGN — the safety gate is the product

- Every draft is saved with **Status = `NEEDS REVIEW`** and the workflow **stops there**.
- There is **intentionally no publish node** (no WordPress, no webhook to your site).
- **Do not** wire this straight into a publish step. AI drafts can be factually wrong, off-brand,
  plagiarism-adjacent, or legally risky. Always keep a human between this sheet and your live site.
- To "publish" later, use a **separate, manually-triggered** workflow that only acts on rows you
  have personally set to `APPROVED`. Keeping the two flows separate means nothing goes live without
  an explicit human action.

---

## Before you start — accounts you'll need (all free to start)

- **n8n** — cloud or self-hosted.
- **Anthropic API key** — for drafting (`console.anthropic.com → API Keys`). Cost scales with how
  often the feed updates; `sonnet` keeps it low.
- **Google account** — for the review Sheet.

---

## Setup (about 10 minutes)

1. **Import** — n8n → **Workflows → Import from File** → pick `workflow.json`.
2. **Connect your credentials** (table below).
3. **Watch RSS Feed** — set `feedUrl` (your news/industry feed) and the poll interval (default
   every 1 hour).
4. **Draft Post (Claude)** — attach the Header Auth credential (your Anthropic key). The **system
   prompt** in the JSON body is where voice/length/angle live — edit freely. Default model is
   `claude-sonnet-4-6`.
5. **Save Draft (Review Only)** — **Document** = your Sheet, **Sheet** = tab (`Drafts for
   Review`). Add header row 1: `Date | Source | Suggested Title | Draft Body | Status`.
6. **Activate**.

### Credentials

| Node | Credential type | How to set it |
|------|-----------------|---------------|
| Draft Post (Claude) | `httpHeaderAuth` | *Credentials → New → Header Auth* → **Name** = `x-api-key`, **Value** = your Anthropic key (`sk-ant-…`). |
| Save Draft (Review Only) | `googleSheetsOAuth2Api` | *Credentials → New → Google Sheets OAuth2 API* → sign in with Google. |

The key is sent via the credential, so it **never appears in the workflow file**. All references
are empty `REPLACE_WITH_*` placeholders.

---

## How dedupe works — and its limits

Two layers, on purpose:
1. **The RSS trigger** only emits items newer than the last successful poll.
2. **Dedupe New Items** is the backstop: it keeps a running list of every item's `guid` (falling
   back to `link`/`title`) in the workflow's **static data** (last 1000 keys) and drops anything
   already seen. This survives restarts, overlapping polls, and feeds that re-emit items.

**Honest limits:**
- A feed with **no stable guid** that also rewrites its links can produce the same article twice.
- **Clearing the workflow's execution/static data** resets the memory — the next poll may re-draft
  recent items once.
- Dedupe is **per workflow** — two copies watching the same feed keep separate lists.
- The **first activation** may draft a batch of the feed's current items at once. Expected — just
  delete the ones you don't want.

---

## Optional

- **Multiple feeds** — simplest is to **duplicate the workflow** once per feed (isolated dedupe).
  Or replace the trigger with a **Schedule Trigger → Code (list of feed URLs) → RSS Read** loop;
  the dedupe logic already handles a mixed stream.
- **Use OpenAI instead of Claude** — on *Draft Post (Claude)*: URL →
  `https://api.openai.com/v1/chat/completions`; Header Auth **Name** = `Authorization`,
  **Value** = `Bearer sk-…`; body → OpenAI chat shape. Then in *Parse Draft* change the first read
  to `out.choices?.[0]?.message?.content`. The title/body JSON contract stays the same.

---

## Verify on your instance

- After import, confirm no node is flagged "outdated" for your n8n version (the RSS trigger is v1).
- Do one live run with your API key against your real feed and confirm a draft row appears with
  Status `NEEDS REVIEW` and a readable title/body.
- Expect a first-activation batch (it may draft several current items at once).

---

*This is an importable template you connect to your own n8n, Anthropic, and Google accounts — not a
hosted/done-for-you service. Want us to set it up for you? Add **Implementation Support** at
checkout, or reply to your receipt email.*
