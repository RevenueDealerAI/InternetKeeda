/**
 * Idempotent Cashfree plan provisioning — LIVE ONLY.
 *
 * Refuses to run unless CASHFREE_MODE=LIVE. We're going direct-to-
 * production for this rollout (the sandbox plan diag already showed
 * the test plan exists separately and is not blocking anything);
 * forcing LIVE here prevents an accidental sandbox-only provision
 * that would leave prod still broken.
 *
 * For each plan:
 *   1. GET /pg/plans/{plan_id}
 *   2. If 200 → log "already exists", print the live record.
 *   3. If 400 plan_not_found → POST /pg/plans with the full body,
 *      then GET again and print the live record so the operator
 *      can eyeball what Cashfree actually stored.
 *   4. Any other status → log and bail.
 *
 * Run:
 *   CASHFREE_MODE=LIVE \
 *     CASHFREE_APP_ID=<live_app_id> \
 *     CASHFREE_SECRET_KEY=<live_secret> \
 *     npx tsx scripts/cashfree-create-plans.ts
 *
 * Or with an env file that pins LIVE:
 *   npx tsx --env-file=.env.production scripts/cashfree-create-plans.ts
 *
 * No writes to MongoDB. Cashfree-only.
 */
import "dotenv/config";
import { PRICING } from "../src/lib/cashfree";

const API_VERSION = "2026-01-01";

interface PlanSpec {
  plan_id: string;
  plan_name: string;
  plan_type: "PERIODIC" | "ON_DEMAND";
  plan_currency: string;
  /** Major units (rupees for INR). */
  plan_amount: number;
  /** Major units. Cashfree caps per-cycle authorisation at this. */
  plan_max_amount: number;
  /** 0 = unlimited. */
  plan_max_cycles: number;
  plan_intervals: number;
  plan_interval_type: "DAY" | "WEEK" | "MONTH" | "YEAR";
  plan_note?: string;
}

const PLANS: PlanSpec[] = [
  {
    plan_id: PRICING.MONTHLY_LISTING.planId,
    plan_name: "Monthly Tool Listing",
    plan_type: "PERIODIC",
    plan_currency: PRICING.MONTHLY_LISTING.currency,
    plan_amount: PRICING.MONTHLY_LISTING.amountMinorUnit / 100,
    plan_max_amount: PRICING.MONTHLY_LISTING.maxAmountMinorUnit / 100,
    plan_max_cycles: 0,
    plan_intervals: 1,
    plan_interval_type: "MONTH",
    plan_note: "Internet Keeda — monthly directory listing",
  },
];

/** LIVE-only by construction — refuses to point at sandbox. */
function liveBase(): string {
  const raw = (process.env.CASHFREE_MODE || "").toUpperCase();
  const isLive = raw === "LIVE" || raw === "PROD" || raw === "PRODUCTION";
  if (!isLive) {
    console.error(
      `Refusing to run: CASHFREE_MODE must be LIVE (got "${process.env.CASHFREE_MODE ?? "<unset>"}").`,
    );
    console.error(
      "  This script provisions LIVE plans. Set CASHFREE_MODE=LIVE in the",
    );
    console.error(
      "  env file or shell before re-running. The sandbox plan diagnostic",
    );
    console.error("  is at scripts/diag-cashfree-plans.ts.");
    process.exit(2);
  }
  return "https://api.cashfree.com/pg";
}

interface FetchOpts {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
}

async function cf(
  base: string,
  appId: string,
  secret: string,
  opts: FetchOpts,
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${base}${opts.path}`, {
    method: opts.method,
    headers: {
      "x-client-id": appId,
      "x-client-secret": secret,
      "x-api-version": API_VERSION,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

function printLivePlan(p: unknown) {
  if (!p || typeof p !== "object") {
    console.log("  (no plan body returned)");
    return;
  }
  const r = p as Record<string, unknown>;
  console.log(`  plan_id            : ${r.plan_id}`);
  console.log(`  plan_name          : ${r.plan_name ?? "—"}`);
  console.log(`  status             : ${r.status ?? "—"}`);
  console.log(`  plan_currency      : ${r.plan_currency ?? "—"}`);
  console.log(
    `  amount / max       : ${r.plan_amount ?? "?"} / ${r.plan_max_amount ?? "?"}`,
  );
  console.log(`  plan_type          : ${r.plan_type ?? "—"}`);
  console.log(
    `  intervals          : ${r.plan_intervals ?? "?"} × ${r.plan_interval_type ?? "?"}`,
  );
  console.log(
    `  plan_max_cycles    : ${r.plan_max_cycles === 0 ? "unlimited" : r.plan_max_cycles ?? "?"}`,
  );
}

async function main() {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) {
    console.error("CASHFREE_APP_ID / CASHFREE_SECRET_KEY not set");
    process.exit(1);
  }
  const base = liveBase();
  console.log(`\n=== Cashfree plan provisioning · LIVE ===`);
  console.log(`  base    = ${base}`);
  console.log(`  app_id  = ${appId.slice(0, 12)}…`);
  console.log(`  plans   = ${PLANS.length}\n`);

  const verifiedRows: Array<{
    plan_id: string;
    plan_currency?: unknown;
    plan_amount?: unknown;
    plan_max_amount?: unknown;
    status?: unknown;
    action: "existed" | "created";
  }> = [];

  for (const plan of PLANS) {
    console.log(`──── ${plan.plan_id} ────`);
    console.log(`  spec from code     : ${plan.plan_amount} ${plan.plan_currency} · max ${plan.plan_max_amount} · ${plan.plan_intervals}×${plan.plan_interval_type} · cycles ${plan.plan_max_cycles === 0 ? "∞" : plan.plan_max_cycles}`);

    const existing = await cf(base, appId, secret, {
      method: "GET",
      path: `/plans/${encodeURIComponent(plan.plan_id)}`,
    });

    if (existing.status === 200) {
      console.log(`  status             : already exists, skipping POST`);
      printLivePlan(existing.json);
      const r = existing.json as Record<string, unknown>;
      verifiedRows.push({
        plan_id: plan.plan_id,
        plan_currency: r.plan_currency,
        plan_amount: r.plan_amount,
        plan_max_amount: r.plan_max_amount,
        status: r.status,
        action: "existed",
      });
      console.log();
      continue;
    }

    if (
      existing.status === 400 &&
      (existing.json as { code?: string })?.code === "plan_not_found"
    ) {
      console.log(`  status             : plan_not_found, creating…`);
      const created = await cf(base, appId, secret, {
        method: "POST",
        path: "/plans",
        body: {
          plan_id: plan.plan_id,
          plan_name: plan.plan_name,
          plan_type: plan.plan_type,
          plan_currency: plan.plan_currency,
          plan_amount: plan.plan_amount,
          plan_max_amount: plan.plan_max_amount,
          plan_max_cycles: plan.plan_max_cycles,
          plan_intervals: plan.plan_intervals,
          plan_interval_type: plan.plan_interval_type,
          plan_note: plan.plan_note,
        },
      });
      if (created.status !== 200) {
        console.error(`  ✗ POST /pg/plans failed: ${created.status}`);
        console.error(JSON.stringify(created.json, null, 2));
        process.exitCode = 1;
        continue;
      }
      // Re-read so we print whatever Cashfree actually stored, not
      // just what we sent.
      const verified = await cf(base, appId, secret, {
        method: "GET",
        path: `/plans/${encodeURIComponent(plan.plan_id)}`,
      });
      if (verified.status !== 200) {
        console.error(
          `  ✗ POST succeeded but GET re-read failed: ${verified.status}`,
        );
        console.error(JSON.stringify(verified.json, null, 2));
        process.exitCode = 1;
        continue;
      }
      console.log(`  ✓ created.`);
      printLivePlan(verified.json);
      const r = verified.json as Record<string, unknown>;
      verifiedRows.push({
        plan_id: plan.plan_id,
        plan_currency: r.plan_currency,
        plan_amount: r.plan_amount,
        plan_max_amount: r.plan_max_amount,
        status: r.status,
        action: "created",
      });
      console.log();
      continue;
    }

    console.error(
      `  ✗ unexpected GET response: ${existing.status}`,
    );
    console.error(JSON.stringify(existing.json, null, 2));
    process.exitCode = 1;
  }

  // Eyeball table — compare what's now live against
  // src/lib/cashfree.ts PRICING before any subscription attempt.
  console.log("\n=== LIVE plans verification (compare against src/lib/cashfree.ts PRICING) ===\n");
  const header = `${"plan_id".padEnd(28)} ${"ccy".padEnd(4)} ${"amount".padStart(8)} ${"max_amt".padStart(8)} ${"status".padEnd(10)} action`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of verifiedRows) {
    console.log(
      `${String(r.plan_id).padEnd(28)} ${String(r.plan_currency ?? "—").padEnd(4)} ${String(r.plan_amount ?? "?").padStart(8)} ${String(r.plan_max_amount ?? "?").padStart(8)} ${String(r.status ?? "—").padEnd(10)} ${r.action}`,
    );
  }
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
