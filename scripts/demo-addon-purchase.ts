/**
 * Demo: simulate a $118 purchase (workflow $19 + implementation support
 * $99) on the test DB and confirm addOnIds + needsFollowUp persist onto
 * the StorePurchase row. Mirrors what the PSP webhook would do after a
 * buyer clicks the now-animated checkout's Pay button.
 *
 * Run:  npx tsx scripts/demo-addon-purchase.ts
 *
 * Cleans up after itself so re-running is safe.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();
import mongoose from 'mongoose';
import { StoreProduct } from '../src/features/store/models/StoreProduct';
import { StorePurchase } from '../src/features/store/models/StorePurchase';
import { Payment } from '../src/app/api/models/Payment';
import { markStorePaid } from '../src/features/store/server/markPaid';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'test' });

  const product = await StoreProduct.findOne({
    slug: 'n8n-stripe-paid-invoices-to-sheets',
  });
  if (!product) throw new Error('seed product missing on test DB');

  const orderId = 'demo_addon_' + Date.now();
  const fakeUserId = 'user_addon_demo_buyer';
  const baseUsd = product.priceUsdMinor; // 1900 = $19
  const addOnUsd = 9900; // $99 implementation support
  const totalUsd = baseUsd + addOnUsd;

  await Payment.create({
    userId: fakeUserId,
    provider: 'paypal',
    orderId,
    paypalOrderId: orderId,
    amount: totalUsd,
    currency: 'USD',
    productType: 'store-purchase',
    boostDurationDays: 0,
    status: 'pending',
    metadata: {
      storeProductId: String(product._id),
      storeProductTitle: product.title,
      addOnIds: ['implementation-support'],
      addOnAmountMinor: addOnUsd,
      needsFollowUp: true,
    },
  });
  console.log('  1. Created pending Payment  orderId=' + orderId);
  console.log('       amount=' + totalUsd + ' cents (= $' + (totalUsd/100).toFixed(2) + ' = $19 + $99 addon)');

  const result = await markStorePaid(orderId, {
    source: 'webhook',
    paypalCaptureId: 'cap_demo_' + Date.now(),
  });
  console.log('  2. markStorePaid: applied=' + result.applied + '  purchaseId=' + result.purchaseId);

  const purchase = await StorePurchase.findOne({
    userId: fakeUserId,
    paymentId: String((await Payment.findOne({ orderId }))!._id),
  }).lean();
  if (!purchase) throw new Error('StorePurchase not minted');

  console.log('  3. StorePurchase row:');
  console.log('       userId            = ' + purchase.userId);
  console.log('       productSlug       = ' + purchase.productSlug);
  console.log('       amountPaidMinor   = ' + purchase.amountPaidMinor + ' ($' + (purchase.amountPaidMinor/100).toFixed(2) + ')');
  console.log('       addOnIds          = [' + (purchase.addOnIds || []).join(',') + ']');
  console.log('       addOnAmountMinor  = ' + (purchase.addOnAmountMinor || 0) + ' ($' + ((purchase.addOnAmountMinor||0)/100).toFixed(2) + ')');
  console.log('       needsFollowUp     = ' + purchase.needsFollowUp);
  console.log('       status            = ' + purchase.status);

  await StorePurchase.deleteOne({ _id: purchase._id });
  await Payment.deleteOne({ orderId });
  await StoreProduct.updateOne({ _id: product._id }, { $inc: { salesCount: -1 } });
  console.log('  4. cleaned up: removed test purchase + payment + restored salesCount');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
