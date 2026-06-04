# Stripe Paid Invoices → Google Sheets

A no-fluff n8n workflow that logs every paid Stripe invoice into a
Google Sheet, one row per invoice. Built so solo founders and small
finance ops teams stop maintaining manual CSVs.

## What you get

- Stripe webhook trigger filtered to `invoice.paid`
- A Code node that normalises the Stripe payload (currency, tax,
  totals, paid-at timestamp, hosted invoice URL)
- A Google Sheets node that appends one row per invoice
- Idempotency via the `stripe_invoice_id` column — re-imported
  webhooks won't double-insert if you switch the append step to
  "upsert" mode later

## Requirements

- n8n 1.36+ (uses Schedule Trigger v1.2 and Google Sheets node v4.4)
- A Stripe account with a webhook endpoint you can point at n8n
- A Google account with the Sheets API enabled
- A target Google Sheet — see column layout below

## Setup

### 1. Credentials

In n8n → Settings → Credentials, create:

- **Stripe API** — paste your secret key (`sk_live_...` or `sk_test_...`).
- **Google Sheets OAuth2 API** — connect your Google account.

### 2. Import the workflow

In n8n → Workflows → Import from File → select `workflow.json` from
this bundle.

### 3. Wire up each node

Open the imported workflow and resolve every node that shows a yellow
"missing credential" pill. You only need to do this once.

- **Stripe: invoice.paid** — pick the Stripe credential you created.
  Save. n8n will issue a fresh webhook URL — copy it.
- **Append row to Sheet** — pick your Google Sheets credential, then
  open the document picker and choose your target spreadsheet + tab.

### 4. Register the webhook with Stripe

Go to Stripe Dashboard → Developers → Webhooks → Add endpoint. Paste
the URL n8n gave you. Select `invoice.paid` as the listened event.

### 5. Activate the workflow

Top-right of the n8n canvas. Send a Stripe test event from the
Stripe Dashboard ("Send test webhook") and confirm a row lands in
your sheet.

## Google Sheet column layout (recommended)

The Code node emits these keys — match them as your header row:

```
stripe_invoice_id | number | customer_email | currency
amount_due_minor  | amount_paid_minor | tax_minor | total_minor
amount_paid_major | tax_major | total_major
status | created_at | paid_at | hosted_invoice_url
first_line_description
```

`_minor` columns are integer paise/cents (Stripe's native format).
`_major` columns are pre-formatted with two decimal places for
human reading. Pick whichever fits your bookkeeping.

## Customisations

- **Filter by amount**: insert a `IF` node between the Code node and
  the Sheets node — for example `{{ $json.total_minor }} >= 10000`
  to ignore invoices under $100.
- **Multi-currency reporting**: drop a second Sheets node behind an
  `IF` to split USD vs INR vs EUR into separate tabs.
- **Slack ping on large invoices**: add a Slack node after the
  Sheets append for invoices over your threshold.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Workflow does not fire on Stripe events | Confirm the Stripe webhook URL matches the one n8n shows, and that the endpoint status in Stripe Dashboard is "Healthy." |
| Sheets node errors with 401 | Re-authorise the Google Sheets OAuth2 credential. The token expired or scopes changed. |
| Rows append to the wrong tab | The Sheets node uses the cached resource name. Re-pick the tab from the dropdown after switching sheets. |

## Support

Questions about the workflow? Ping the Internet Keeda team on
WhatsApp via the Connect on WhatsApp link on
internetkeeda.com/store — we built it, we'll help you ship it.
