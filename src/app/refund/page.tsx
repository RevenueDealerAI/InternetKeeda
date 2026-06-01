import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & cancellation policy',
  description: 'Refund and subscription cancellation rules for Internet Keeda.',
  alternates: { canonical: '/refund' },
  openGraph: { url: '/refund', title: 'Refund & cancellation policy', description: 'Refund and subscription cancellation rules for Internet Keeda.' },
};

import { LegalPage } from '@/components/nexus/LegalPage';
import { LegalEntityBlock } from '@/components/nexus/LegalEntityBlock';
import { WhatsAppSupportButton } from '@/components/nexus/WhatsAppSupportButton';
import { BRAND } from '@/lib/brand';

const LAST_UPDATED = '2026-05-30';

export default function RefundPage() {
  return (
    <LegalPage
      eyebrow="Â§ legal â€” refund"
      title="Refund & cancellation policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <p className="m-0">
          All payments to {BRAND.name} â€” including one-time boost payments
          and recurring subscription fees â€” are <strong>generally
          non-refundable</strong>. Once a boost is activated or a
          subscription period begins, the corresponding service has been
          delivered.
        </p>
      }
      sections={[
        {
          id: 'discretionary',
          heading: 'Discretionary refunds',
          body: (
            <>
              <p className="m-0">
                In specific cases â€” duplicate charges, proven service failure
                on our side, or unauthorized transactions â€” we may at our
                sole discretion issue a full or partial refund. Requests must
                be submitted within 7 days of the transaction, with the
                transaction reference and reason. We respond within 5
                business days. See the contact block below for the
                submission channel.
              </p>
            </>
          ),
        },
        {
          id: 'subscription-cancel',
          heading: 'Subscription cancellation',
          body: (
            <p className="m-0">
              You may cancel a recurring subscription at any time from your
              dashboard. Cancellation stops future renewals; the current paid
              period continues until its end date. <strong>No proration or
              refund is issued for the unused portion.</strong>
            </p>
          ),
        },
        {
          id: 'boost-cancel',
          heading: 'Boost cancellation',
          body: (
            <p className="m-0">
              One-time boost payments cannot be cancelled once payment is
              authorized. The boost runs for its full duration.
            </p>
          ),
        },
        {
          id: 'chargebacks',
          heading: 'Chargebacks',
          body: (
            <p className="m-0">
              Before initiating a chargeback or dispute through your bank or
              card provider, please contact us. Unjustified chargebacks may
              result in the associated tool listing being removed and the
              account being suspended.
            </p>
          ),
        },
        {
          id: 'processing-time',
          heading: 'Processing time',
          body: (
            <p className="m-0">
              Approved refunds are processed within 7 business days via the
              original payment method. Cashfree (INR) refunds settle in 5-7
              business days; PayPal (USD) refunds in 3-5 business days.
            </p>
          ),
        },
        {
          id: 'contact',
          heading: 'Refund requests',
          body: (
            <>
              <p className="m-0">
                Reach us on WhatsApp with your transaction reference and the
                reason for the refund request. We respond within 5 business
                days.
              </p>
              <div className="mt-4">
                <WhatsAppSupportButton label="Request a refund on WhatsApp" />
              </div>
              <div className="mt-6">
                <LegalEntityBlock />
              </div>
            </>
          ),
        },
      ]}
    />
  );
}
