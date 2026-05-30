/**
 * Read-only audit. Reports gateway mode (TEST vs LIVE) for every
 * Payment and Subscription row, reading the stamped `cashfreeMode`
 * / `paypalMode` field that lands at create time on writes after
 * commit <feat(payments): stamp gateway mode>. For rows written
 * before that commit, the field is undefined — those are reported
 * as "(legacy)" and the operator falls back to cross-referencing
 * approve-URL hints (PayPal) or the gateway dashboard (Cashfree).
 *
 * Replaces the older scripts/audit-paypal-live.ts which inferred
 * PayPal mode from metadata.createResponse.links[].href. That URL-
 * sniffing path stays in here as a secondary signal for legacy PayPal
 * rows, but the stamped field is the system of record going forward.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/audit-payment-modes.ts
 *
 * Makes ZERO writes.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Payment } from "../src/app/api/models/Payment";
import { Subscription } from "../src/app/api/models/Subscription";
import { Tool } from "../src/app/api/models/Tool";

type Mode = "TEST" | "LIVE" | "legacy";

interface PaymentLike {
  _id: mongoose.Types.ObjectId;
  toolId: mongoose.Types.ObjectId | { _id?: mongoose.Types.ObjectId };
  provider?: string;
  orderId: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  cashfreePaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  cashfreeMode?: "TEST" | "LIVE";
  paypalMode?: "TEST" | "LIVE";
  metadata?: Record<string, unknown>;
}

interface SubscriptionLike {
  _id: mongoose.Types.ObjectId;
  toolId: mongoose.Types.ObjectId | { _id?: mongoose.Types.ObjectId };
  provider?: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  cashfreeMode?: "TEST" | "LIVE";
  paypalMode?: "TEST" | "LIVE";
  metadata?: Record<string, unknown>;
}

function modeOf(
  row: { provider?: string; cashfreeMode?: "TEST" | "LIVE"; paypalMode?: "TEST" | "LIVE" },
): Mode {
  if (row.provider === "paypal") return row.paypalMode ?? "legacy";
  // Default to cashfree for legacy rows whose provider field was unset.
  return row.cashfreeMode ?? "legacy";
}

function paypalUrlHint(p: PaymentLike): "SANDBOX" | "LIVE" | undefined {
  const md = p.metadata as
    | { createResponse?: { links?: Array<{ href?: string }> } }
    | undefined;
  for (const l of md?.createResponse?.links ?? []) {
    const href = l?.href;
    if (!href) continue;
    if (href.includes("sandbox")) return "SANDBOX";
    if (href.includes("api.paypal.com") || href.includes("www.paypal.com")) {
      return "LIVE";
    }
  }
  return undefined;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }
  await mongoose.connect(uri);

  console.log("\n=== environment context (this script's runtime) ===");
  console.log(
    `  PAYPAL_MODE     : ${process.env.PAYPAL_MODE ?? "(unset → SANDBOX per src/lib/paypal.ts)"}`,
  );
  console.log(
    `  CASHFREE_MODE   : ${process.env.CASHFREE_MODE ?? "(unset → SANDBOX per src/lib/cashfree.ts)"}`,
  );

  // -------- Payments --------
  console.log("\n=== Payments ===\n");
  const payments = (await Payment.find({})
    .sort({ createdAt: 1 })
    .lean()) as PaymentLike[];

  const pCounts = { TEST: 0, LIVE: 0, legacy: 0 };
  const liveRows: PaymentLike[] = [];
  const liveCaptures: PaymentLike[] = [];
  const legacyRows: PaymentLike[] = [];

  for (const p of payments) {
    const m = modeOf(p);
    pCounts[m] += 1;
    if (m === "LIVE") liveRows.push(p);
    if (m === "legacy") legacyRows.push(p);
    if (m === "LIVE" && p.status === "success") {
      const isPayPalCapture = p.provider === "paypal" && !!p.paypalCaptureId;
      const isCashfreeCapture = p.provider !== "paypal" && !!p.cashfreePaymentId;
      if (isPayPalCapture || isCashfreeCapture) liveCaptures.push(p);
    }
  }

  console.log(
    `Total: ${payments.length}  (TEST: ${pCounts.TEST}, LIVE: ${pCounts.LIVE}, legacy/unstamped: ${pCounts.legacy})\n`,
  );

  if (liveRows.length > 0) {
    console.log("--- LIVE Payment rows ---\n");
    for (const p of liveRows) {
      const flag =
        liveCaptures.includes(p) ? "  ⚠ LIVE CAPTURE — REAL MONEY" : "";
      const tool = await Tool.findById(
        typeof p.toolId === "object" ? (p.toolId as { _id?: unknown })._id ?? p.toolId : p.toolId,
      )
        .select("name")
        .lean();
      const toolName = (tool as { name?: string } | null)?.name ?? "(missing)";
      console.log(`  _id              : ${p._id}${flag}`);
      console.log(`  provider         : ${p.provider ?? "(unset)"}`);
      console.log(`  tool             : ${toolName}`);
      console.log(`  amount           : ${p.amount} ${p.currency}`);
      console.log(`  status           : ${p.status}`);
      console.log(`  paypalCaptureId  : ${p.paypalCaptureId ?? "(none)"}`);
      console.log(`  cashfreePaymentId: ${p.cashfreePaymentId ?? "(none)"}`);
      console.log(`  createdAt        : ${new Date(p.createdAt).toISOString()}`);
      console.log();
    }
  } else {
    console.log("  ✓ no LIVE Payment rows\n");
  }

  if (legacyRows.length > 0) {
    console.log(
      `--- legacy/unstamped Payment rows (${legacyRows.length}) ---\n`,
    );
    console.log(
      "  These rows were created before the gateway-mode stamp shipped.",
    );
    console.log(
      "  PayPal hint comes from metadata.createResponse.links[].href.",
    );
    console.log(
      "  Cashfree legacy rows have no in-document mode signal — verify",
    );
    console.log("  via the Cashfree dashboard.\n");
    for (const p of legacyRows) {
      const hint =
        p.provider === "paypal"
          ? paypalUrlHint(p) ?? "(no link hint)"
          : "(cashfree — dashboard cross-ref required)";
      console.log(
        `  ${p._id}  ${p.provider ?? "?"}  ${p.status}  ${p.amount} ${p.currency}  ${new Date(p.createdAt).toISOString()}  hint=${hint}`,
      );
    }
    console.log();
  }

  // -------- Subscriptions --------
  console.log("=== Subscriptions ===\n");
  const subs = (await Subscription.find({})
    .sort({ createdAt: 1 })
    .lean()) as SubscriptionLike[];

  const sCounts = { TEST: 0, LIVE: 0, legacy: 0 };
  const sLiveRows: SubscriptionLike[] = [];
  const sLegacyRows: SubscriptionLike[] = [];

  for (const s of subs) {
    const m = modeOf(s);
    sCounts[m] += 1;
    if (m === "LIVE") sLiveRows.push(s);
    if (m === "legacy") sLegacyRows.push(s);
  }
  console.log(
    `Total: ${subs.length}  (TEST: ${sCounts.TEST}, LIVE: ${sCounts.LIVE}, legacy/unstamped: ${sCounts.legacy})\n`,
  );

  if (sLiveRows.length > 0) {
    console.log("--- LIVE Subscription rows ---\n");
    for (const s of sLiveRows) {
      const tool = await Tool.findById(
        typeof s.toolId === "object" ? (s.toolId as { _id?: unknown })._id ?? s.toolId : s.toolId,
      )
        .select("name")
        .lean();
      const toolName = (tool as { name?: string } | null)?.name ?? "(missing)";
      const flag =
        s.status === "active" ? "  ⚠ LIVE ACTIVE SUBSCRIPTION — billing real money" : "";
      console.log(`  _id              : ${s._id}${flag}`);
      console.log(`  provider         : ${s.provider ?? "(unset)"}`);
      console.log(`  tool             : ${toolName}`);
      console.log(`  amount           : ${s.amount} ${s.currency} / cycle`);
      console.log(`  status           : ${s.status}`);
      console.log(`  subscriptionId   : ${s.subscriptionId}`);
      console.log(`  createdAt        : ${new Date(s.createdAt).toISOString()}`);
      console.log();
    }
  } else {
    console.log("  ✓ no LIVE Subscription rows\n");
  }

  if (sLegacyRows.length > 0) {
    console.log(
      `--- legacy/unstamped Subscription rows (${sLegacyRows.length}) ---\n`,
    );
    for (const s of sLegacyRows) {
      console.log(
        `  ${s._id}  ${s.provider ?? "?"}  ${s.status}  ${s.amount} ${s.currency}  ${new Date(s.createdAt).toISOString()}`,
      );
    }
    console.log();
  }

  // -------- summary --------
  console.log("=== summary ===\n");
  console.log(
    `Payments       : LIVE=${pCounts.LIVE} (real captures: ${liveCaptures.length}),  TEST=${pCounts.TEST},  legacy=${pCounts.legacy}`,
  );
  console.log(
    `Subscriptions  : LIVE=${sCounts.LIVE},  TEST=${sCounts.TEST},  legacy=${sCounts.legacy}`,
  );
  console.log();

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
