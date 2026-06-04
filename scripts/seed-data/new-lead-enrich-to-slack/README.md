# New Lead → Enrich → Slack Notification

A drop-in lead-intake endpoint. POST a lead with an email address,
this workflow enriches it via Clearbit (or any HTTP-shaped
enrichment API), then posts a structured notification to a Slack
channel. The webhook responds immediately so your landing-page form
doesn't block.

## What you get

- Webhook endpoint at `/webhook/lead-intake` (n8n issues the full
  URL on activation)
- Server-side email validation in a Code node
- Clearbit `combined/find` call (swap in any enrichment provider —
  it's just an HTTP node)
- Shape-and-merge logic that survives unknown emails (Clearbit 404s
  gracefully)
- Slack notification with title, headcount, industry, LinkedIn, and
  the lead's original message
- Webhook responds 200 to the caller immediately, in parallel with
  the enrichment branch

## Requirements

- n8n 1.36+
- A Clearbit API key (or an equivalent — Apollo, Hunter, People Data
  Labs all expose similar shapes)
- A Slack workspace with bot permissions to post to your target
  channel

## Setup

### 1. Credentials

In n8n → Settings → Credentials, create:

- **HTTP Bearer Auth** — paste your Clearbit secret key.
- **Slack API** — bot token (recommended). Make sure the bot is
  invited to the destination channel.

### 2. Import the workflow

n8n → Workflows → Import from File → `workflow.json`.

### 3. Wire up each node

- **Enrich via Clearbit** — pick the HTTP Bearer Auth credential.
  If you use a different enrichment provider, replace the URL and
  optionally the credential type.
- **Notify Slack channel** — pick the Slack credential, then open
  the channel dropdown and select your target channel.

### 4. Activate the workflow

Top-right of the canvas. n8n surfaces the public webhook URL at the
top of the Webhook node. POST a test lead:

```bash
curl -X POST <YOUR_N8N_WEBHOOK_URL> \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founders@stripe.com",
    "name":  "Test Founder",
    "company": "Stripe",
    "message": "Curious about your pricing tiers.",
    "source": "manual-test"
  }'
```

You should see a Slack message land within ~2 seconds.

## Payload contract

The webhook accepts a JSON body with:

- `email` (required) — a syntactically valid email address.
- `name`, `company`, `message`, `source` (all optional) — surfaced
  in the Slack message if present.

Anything else you POST is ignored (but available in the Validate
node's `body` if you want to extend it).

## Response shape

Caller receives:

```json
{ "ok": true, "received_at": "2026-06-04T05:00:00.000Z" }
```

…immediately after validation, before enrichment finishes. Drop
this URL straight into your landing-page form action.

## Customisations

- **Slack → email digest**: replace the Slack node with a Send Email
  node. Buffer leads with a Schedule Trigger if you want a daily
  digest instead of per-lead alerts.
- **CRM write-back**: add a HubSpot / Pipedrive / Notion node after
  the Shape step to write the enriched record straight into your
  CRM. Use the same enriched JSON the Slack node already consumes.
- **Lead scoring**: insert a Set node before the Slack node to
  compute a score from headcount + funding + industry. Branch a
  high-priority alert via an IF node.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Webhook returns 500 with "Missing or invalid email" | The POST body did not include a valid `email`. Check your form's content-type is `application/json` or pass `Content-Type` correctly. |
| Slack notification never lands | The bot isn't in the channel. Invite it: `/invite @your-bot` in the channel. |
| Clearbit returns 401 | Wrong / expired bearer token. Re-paste in the credential. |
| Enrichment fields are mostly empty | Clearbit doesn't have a record for that domain. The Shape step degrades gracefully — Slack still gets the basic info from the form. |

## Support

Questions? Ping us on WhatsApp via internetkeeda.com/store →
Connect on WhatsApp.
