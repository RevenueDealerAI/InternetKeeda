# RSS → AI Summary → WordPress Draft

Polls an RSS feed every two hours, de-dupes anything we've already
processed, asks OpenAI for a tight editorial summary, and pushes a
draft post into WordPress. Ready to publish after a human eyeball.

## What you get

- Schedule Trigger (2-hour cadence — configurable in one place)
- RSS Feed Read node pointing at any feed URL
- De-duplication via workflow static data so the same item never
  generates two drafts
- OpenAI Chat Completions call with a tuned system prompt that
  outputs short, HTML-formatted summaries
- WordPress draft creation with title + body + a credited source
  link footer

## Requirements

- n8n 1.36+ (uses Schedule Trigger v1.2)
- An OpenAI API key with access to `gpt-4o-mini`
- A WordPress site reachable from the n8n instance, with REST API
  enabled, plus an application password for a user that can create
  drafts

## Setup

### 1. Credentials

In n8n → Settings → Credentials, create:

- **OpenAI API** — paste your API key.
- **WordPress API** — host URL (e.g. `https://yoursite.com`),
  username, and application password (NOT your login password — see
  WordPress Users → Application Passwords).

### 2. Import the workflow

n8n → Workflows → Import from File → `workflow.json`.

### 3. Wire up each node

- **Fetch RSS feed** — replace `REPLACE_WITH_YOUR_RSS_FEED_URL` with
  the feed you want monitored.
- **Summarise with OpenAI** — pick the OpenAI credential. Model and
  prompt live in the JSON body field; tweak temperature there if you
  want the summaries tighter / looser.
- **Create WordPress draft** — pick the WordPress credential. The
  `status: draft` flag means nothing ever auto-publishes.

### 4. Activate the workflow

Top-right of the canvas. The Schedule Trigger fires every 2 hours.
For an immediate test, click "Execute Workflow" once.

## Behaviour notes

- **De-dupe is in-memory per workflow.** Static data persists across
  executions on a single n8n instance but is not shared across
  instances. If you run n8n in HA mode, swap the de-dupe Code node
  for a Postgres / Redis lookup keyed on `link`.
- **OpenAI prompt** is intentionally short and HTML-only. WordPress
  doesn't render markdown by default in the classic editor — HTML
  paragraphs paste cleanly into both Gutenberg and Classic.
- **Draft status only.** Nothing goes live without a human flip. If
  you trust the model enough to auto-publish, swap `draft` for
  `publish` in the WordPress node's Additional Fields.

## Customisations

- **Multiple feeds**: clone the RSS node + Merge them before the
  de-dupe step. The static-data Set already keys on `link`, so
  cross-feed duplicates are handled.
- **Different model**: change `gpt-4o-mini` in the OpenAI request
  body to any chat-completions-compatible model on your account.
- **Tag drafts**: in the WordPress node → Additional Fields, add
  `categories` or `tags` so editors can filter your AI drafts.

## Cost

At `gpt-4o-mini` rates and ~2 KB excerpts, expect under $0.001 per
summary. A noisy daily feed of 50 items costs roughly $0.05/month.

## Troubleshooting

| Symptom | Fix |
|---|---|
| No drafts appear | Open the workflow's Executions tab. If they're firing but the RSS node returns 0 items, your feed URL is wrong or the feed itself is empty. |
| OpenAI 401 | Credential expired / wrong key. Re-paste and re-test. |
| WordPress 401 / 403 | Application password is wrong, or the user doesn't have `edit_posts` capability. Test with `curl -u user:apppassword https://yoursite.com/wp-json/wp/v2/posts` first. |
| Duplicate drafts after restart | n8n's static data is per-instance and per-workflow. After a redeploy, the seen-set starts empty and you'll re-process recent items. Swap to a DB-backed de-dupe if this is a problem. |

## Support

Questions? Ping us on WhatsApp via internetkeeda.com/store →
Connect on WhatsApp.
