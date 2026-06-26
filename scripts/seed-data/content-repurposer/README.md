# Content Repurposer (n8n)

Paste one content URL → get a Twitter/X thread, **3** distinct LinkedIn posts, and a newsletter
blurb in your chosen tone, saved to a Sheet you can copy from. Turns hours of manual reformatting
into one click.

**In the zip:** `workflow.json` (import this into n8n) + this guide.

---

## What it does

```
Paste Content URL → Fetch Source → Extract Article Text → Generate (Claude) → Split Sections → Save Repurposed Content
   (Form trigger)    (HTTP)         (Code)                 (HTTP → Anthropic)  (Code)           (Google Sheets)
```

| Node | What it does |
|------|--------------|
| **Paste Content URL** | A hosted form: **Content URL** (required) + **Tone** dropdown (casual / professional). |
| **Fetch Source** | GETs the URL as text with a browser User-Agent, 30s timeout, 1 retry. |
| **Extract Article Text** | Strips scripts/styles/tags/entities, collapses whitespace, caps at ~24k chars (~6k tokens). |
| **Generate (Claude)** | Calls the Anthropic Messages API and asks for 3 delimited sections. Key supplied as a credential. |
| **Split Sections** | Splits the output on `===TWITTER=== / ===LINKEDIN=== / ===NEWSLETTER===`. |
| **Save Repurposed Content** | Appends a row: Time, Source URL, Tone, Twitter Thread, LinkedIn Posts, Newsletter. |

---

## Before you start — accounts you'll need (all free to start)

- **n8n** — cloud or self-hosted.
- **Anthropic API key** — for the AI generation (`console.anthropic.com → API Keys`). Runs at a
  few cents per article on the default model.
- **Google account** — for the output Sheet.

---

## Setup (about 15 minutes)

1. **Import** — n8n → **Workflows → Import from File** → pick `workflow.json`.
2. **Connect your credentials** (table below).
3. **Generate (Claude)** — attach the Header Auth credential (your Anthropic key). Tone/format
   live in the `system` prompt; the default model in the JSON body is `claude-sonnet-4-6` (swap to
   `claude-opus-4-8` for higher quality at higher cost).
4. **Save Repurposed Content** — **Document** = your Sheet, **Sheet** = tab (`Repurposed`). Add
   header row 1: `Time | Source URL | Tone | Twitter Thread | LinkedIn Posts | Newsletter`.
5. **Activate**, open the form's Production URL, paste a blog URL, pick a tone, submit.

### Credentials

| Node | Credential type | How to set it |
|------|-----------------|---------------|
| Generate (Claude) | `httpHeaderAuth` | *Credentials → New → Header Auth* → **Name** = `x-api-key`, **Value** = your Anthropic key (`sk-ant-…`). |
| Save Repurposed Content | `googleSheetsOAuth2Api` | *Credentials → New → Google Sheets OAuth2 API* → sign in with Google. |

The key is sent via the Header Auth credential, so it **never appears in the workflow file**. All
references are empty `REPLACE_WITH_*` placeholders.

---

## ⚠️ Honest content-fetch limitation — read this

The fetch step is a plain HTTP GET (deliberately — no grey-area scrapers), and that has real limits.

**✅ Reliably works:** public blog posts, articles, docs, and marketing pages that render their
text in the initial HTML (most WordPress, Ghost, public Medium/Substack posts, news articles).

**❌ Does NOT reliably work:**
- **YouTube URLs** — YouTube returns a JavaScript app shell, not the transcript. You will **not**
  get the spoken content from a YouTube link with a plain fetch.
- Pages behind **logins, paywalls, or aggressive bot-blocking**.
- **Heavy single-page apps** that render text only after JS runs.

**What to do instead:** for YouTube, open the video → **… → Show transcript**, copy it, paste it
into any public page (or a "anyone with link" Google Doc), and feed *that* URL. For paywalled/JS
sites, paste the article text into a public page and use that URL. If a fetch returns near-empty
text, the AI output will be thin — that's your signal the page wasn't fetchable.

The *Extract Article Text* node caps input at ~24k characters, so very long pages are truncated to
the first ~6k tokens. Fine for most posts; for book-length sources, point at the key section.

---

## Optional swaps

- **Use OpenAI instead of Claude** — on *Generate (Claude)*: set URL to
  `https://api.openai.com/v1/chat/completions`; Header Auth **Name** = `Authorization`,
  **Value** = `Bearer sk-…`; change the JSON body to the OpenAI chat shape
  (`{"model":"gpt-4o","max_tokens":2500,"messages":[{"role":"system",...},{"role":"user",...}]}`);
  and in *Split Sections* change the text read to
  `const text = out.choices?.[0]?.message?.content || '';`.
- **Output to Google Docs** — replace *Save Repurposed Content* with a **Google Docs** node
  (*Update → Insert Text*) and insert `{{ $json.twitterThread }}` etc. Kept as Sheets in the base
  build because Sheets import-validates cleanly across n8n versions.

---

## Verify on your instance

- After import, confirm no node is flagged "outdated" for your n8n version.
- Do one live run with your API key on a real blog URL and confirm all three sections populate and
  land in the Sheet.
- Check fetch behavior on the specific sites you care about (see the limitation section).
- Watch token cost: long articles + opus = higher spend; sonnet on typical posts is a few cents.

---

*This is an importable template you connect to your own n8n, Anthropic, and Google accounts — not a
hosted/done-for-you service. Want us to set it up for you? Add **Implementation Support** at
checkout, or reply to your receipt email.*
