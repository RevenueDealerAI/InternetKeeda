# Automated SEO Research Bot (n8n)

Your own SEO research analyst, on a schedule. Once a week it reads the new articles from
authoritative SEO sources (Google Search Central + reputable SEO news), has Claude synthesize
them into one clean, sourced briefing — headline findings with links, plus a short "what changed
/ why it matters" — and emails it to you. Set it up once; stay ahead of Google updates, GSC
changes, and algorithm news without doing the reading yourself.

**In the zip:** `workflow.json` (import this into n8n) + this guide.

---

## What it does

```
Weekly Schedule → Config → Split Feeds → Fetch RSS Feeds → Filter New Items
→ Fetch Article HTML → Build Digest Prompt → Claude: Research Digest
→ Compose Digest Email → Gmail: Send Briefing → Record Processed Keys
```

| Node | What it does |
|------|--------------|
| **Weekly Schedule** | Fires Mondays 06:00 (your n8n timezone). A Manual Trigger is included for testing. |
| **Config** | The **only node you edit** — email, focus, feeds, model. All values commented. |
| **Split Feeds → Fetch RSS Feeds** | Reads every feed in your `SOURCE_FEEDS` list. A feed that's down is skipped, never fatal. |
| **Filter New Items** | Keeps only articles from the last `RECENCY_WINDOW_DAYS` (default 14) it has **never processed before** (dedup memory survives restarts). Nothing new → the run ends quietly: no email, no API spend. |
| **Fetch Article HTML** | Pulls each article's full text. 15-second timeout, no retry, continue-on-fail — one slow page can't hang the run; a blocked page falls back to the feed teaser. |
| **Claude: Research Digest** | The **one and only LLM call**. Synthesizes everything into the briefing. Key lives in an n8n credential — never in this file. |
| **Gmail: Send Briefing** | Emails the briefing to `DIGEST_EMAIL_TO`. |
| **Record Processed Keys** | Marks articles as processed **only after the email actually sent** — a failed send means those articles are retried next week, never lost. |

---

## Before you start — accounts you'll need

- **n8n** — cloud or self-hosted.
- **Anthropic API key** — `console.anthropic.com → API Keys`. **Billing must be enabled** (a
  key from a $0 account gets rejected). Typical cost: one call/week on the default
  `claude-sonnet-4-6` — usually a few cents per run.
- **A Gmail account** — sends the briefing to you.

---

## Setup (about 10 minutes)

1. **Import** — n8n → **Workflows → Import from File** → pick `workflow.json`.
2. **Connect credentials** (table below) on the two nodes that show a credential warning.
3. **Edit the Config node** — it's the only one you need to touch:
   - `DIGEST_EMAIL_TO` — **change this** to the inbox that should receive the briefing.
   - `SEO_FOCUS` — what the analysis should emphasize. Default `"technical SEO + indexing"`;
     try `"local SEO"`, `"e-commerce SEO"`, `"news SEO"` — anything.
   - `SOURCE_FEEDS` — starter set is Google Search Central Blog (official), Search Engine
     Roundtable, and Search Engine Land. Add or remove any RSS URL; one line per feed.
   - `RECENCY_WINDOW_DAYS` — how far back "new" reaches (default 14).
   - `ANTHROPIC_MODEL` — default `claude-sonnet-4-6` (smart + cheap). Any Claude model id
     works, e.g. a bigger model for deeper analysis at higher cost.
4. **Test** — hit the Manual Trigger once. You should get the briefing email within a minute
   or two. (Note: dedup memory only persists on *production* runs, so manual tests may
   re-process the same articles — expected.)
5. **Activate** (top right). Done — it now runs every Monday on its own.

### Credentials

| Node | Credential type | How to set it |
|------|-----------------|---------------|
| Claude: Research Digest | `Anthropic` (anthropicApi) | *Credentials → New → Anthropic* → paste your API key. Then select it on the node (it ships as a `REPLACE_WITH_*` placeholder). |
| Gmail: Send Briefing | `Gmail OAuth2` | *Credentials → New → Gmail OAuth2* → sign in with Google. Select it on the node. |

Your key is sent via the credential, so it **never appears in the workflow file**. Both
references ship as `REPLACE_WITH_*` placeholders.

---

## What the weekly email looks like

Subject: `Your weekly SEO research briefing — 2026-07-20`

```
HEADLINE FINDINGS

1. <One-line headline of the week's most important development>
   Two-three sentences: what happened, and what you should do about it.
   https://developers.google.com/search/blog/...

2. <Next finding>
   ...
   https://www.seroundtable.com/...

WHAT CHANGED / WHY IT MATTERS
A short closing analysis connecting the week's items: what actually changed
in how Google crawls, indexes, or ranks, what is probably noise, and the one
action most worth taking this week.

—
Automated SEO Research Bot · 6 new article(s) analyzed this run.
```

Every finding cites one of the fetched articles; official Google statements are weighted above
third-party speculation (and labeled as such). A quiet week gets an honest "nothing significant
this week" instead of padding.

---

## Reliability notes (how it fails safely)

- **Nothing new** → the run stops after the filter. No email, no token spend.
- **A feed or article page is down/slow** → that item is skipped or falls back to its teaser;
  the run continues.
- **Claude returns something malformed or empty** → the compose step **throws**: no email is
  sent and nothing is marked processed, so the same articles are retried next week. Optional:
  set an Error Trigger workflow (workflow Settings → Error Workflow) to get alerted.
- **Dedup memory** is capped at the last 500 article keys and is per-workflow.

---

*This is an importable template you connect to your own n8n, Anthropic, and Google accounts —
not a hosted/done-for-you service. Want us to set it up for you? Add **Implementation Support**
at checkout, or reply to your receipt email.*
