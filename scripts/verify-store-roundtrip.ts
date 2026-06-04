/**
 * End-to-end verification script for the Keeda Labs payment round-trip.
 *
 * For BOTH providers (Cashfree, PayPal):
 *   1. Create a pending Payment row that LOOKS exactly like what the
 *      checkout routes would write (correct productType, currency,
 *      metadata.storeProductId, etc.).
 *   2. Invoke markStorePaid(orderId) — the same function the PSP
 *      webhook handlers + the polling-fallback hit on success.
 *   3. Confirm the Payment row flipped to 'success'.
 *   4. Confirm a StorePurchase row was minted with status='paid'.
 *   5. Confirm the StoreProduct.salesCount incremented by 1.
 *   6. Print the orderId + purchaseId so the dev can browse the
 *      return page and the download endpoint against real rows.
 *
 * Idempotency check: invoke markStorePaid a second time and confirm
 * applied=false (no double-mint, no double sales-count increment).
 *
 *   npx tsx scripts/verify-store-roundtrip.ts
 *
 * Cleanup: pass --cleanup to drop the test rows after printing.
 */

import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

import { Payment } from '../src/app/api/models/Payment';
import { StoreProduct } from '../src/features/store/models/StoreProduct';
import { StorePurchase } from '../src/features/store/models/StorePurchase';
import { markStorePaid } from '../src/features/store/server/markPaid';

const FAKE_USER_ID = 'user_roundtrip_test_buyer';

interface Scenario {
  label: string;
  provider: 'cashfree' | 'paypal';
  currency: 'INR' | 'USD';
  amountMinor: number;
  orderIdSuffix: string;
}

const SCENARIOS: Scenario[] = [
  {
    label: 'Cashfree INR',
    provider: 'cashfree',
    currency: 'INR',
    amountMinor: 149900,
    orderIdSuffix: 'cashfree-rt',
  },
  {
    label: 'PayPal USD',
    provider: 'paypal',
    currency: 'USD',
    amountMinor: 1900,
    orderIdSuffix: 'paypal-rt',
  },
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  const product = await StoreProduct.findOne({
    slug: 'n8n-stripe-invoice-to-sheets',
  });
  if (!product) {
    throw new Error(
      'Seed product missing. Run: npx tsx scripts/seed-store-sample.ts'
    );
  }
  const productId = String(product._id);
  console.log(`\nUsing seed product: ${product.title}  [${productId}]`);
  const baselineSales = product.salesCount;

  const cleanup = process.argv.includes('--cleanup');
  const results: Array<Record<string, unknown>> = [];

  for (const s of SCENARIOS) {
    console.log(`\n──────── ${s.label} ────────`);
    const orderId = `store_${s.orderIdSuffix}_${Date.now()}`;
    const ppOrderId = s.provider === 'paypal' ? orderId : undefined;

    const payment = await Payment.create({
      userId: FAKE_USER_ID,
      provider: s.provider,
      orderId,
      paypalOrderId: ppOrderId,
      amount: s.amountMinor,
      currency: s.currency,
      productType: 'store-purchase',
      boostDurationDays: 0,
      status: 'pending',
      metadata: {
        storeProductId: productId,
        storeProductTitle: product.title,
      },
    });
    console.log(`1. Created pending Payment   _id=${payment._id}`);

    const first = await markStorePaid(orderId, {
      source: s.provider === 'paypal' ? 'polling-fallback' : 'webhook',
      cashfreePaymentId:
        s.provider === 'cashfree' ? `cf_test_${Date.now()}` : undefined,
      paypalCaptureId:
        s.provider === 'paypal' ? `pp_test_${Date.now()}` : undefined,
    });
    console.log(
      `2. markStorePaid #1  applied=${first.applied}  purchaseId=${first.purchaseId}`
    );

    const reread = await Payment.findById(payment._id).lean();
    console.log(`3. Payment.status   = ${reread?.status}`);
    console.log(`   paymentVerifiedVia = ${reread?.paymentVerifiedVia}`);

    const purchase = await StorePurchase.findOne({
      paymentId: String(payment._id),
    }).lean();
    console.log(
      `4. StorePurchase row  _id=${purchase?._id}  status=${purchase?.status}  productSlug=${purchase?.productSlug}`
    );

    const productNow = await StoreProduct.findById(productId).lean();
    console.log(
      `5. StoreProduct.salesCount  baseline=${baselineSales}  now=${productNow?.salesCount}`
    );

    // Idempotency probe — second call must report applied=false and
    // must not bump sales count or create a second purchase row.
    const second = await markStorePaid(orderId, { source: 'webhook' });
    const productAfterSecond = await StoreProduct.findById(productId).lean();
    const purchaseCount = await StorePurchase.countDocuments({
      paymentId: String(payment._id),
    });
    console.log(
      `6. markStorePaid #2 (replay)  applied=${second.applied}  purchaseCount=${purchaseCount}  salesCount=${productAfterSecond?.salesCount}`
    );

    results.push({
      scenario: s.label,
      orderId,
      paymentDbId: String(payment._id),
      purchaseId: String(purchase?._id),
      paymentStatus: reread?.status,
      purchaseStatus: purchase?.status,
      idempotent_replay_applied_false: second.applied === false,
      sales_count_did_not_double_increment:
        productAfterSecond?.salesCount === (baselineSales + results.length + 1),
    });

    if (cleanup) {
      await StorePurchase.deleteOne({ paymentId: String(payment._id) });
      await Payment.deleteOne({ _id: payment._id });
      console.log('   cleaned up Payment + StorePurchase rows for this scenario');
    }
  }

  if (cleanup) {
    // Roll the sales count back to baseline.
    await StoreProduct.updateOne(
      { _id: product._id },
      { $set: { salesCount: baselineSales } }
    );
    console.log('\ncleaned: sales count reset to baseline');
  }

  console.log('\n──────── SUMMARY ────────');
  console.log(JSON.stringify(results, null, 2));
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
