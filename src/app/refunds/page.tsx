'use client';

import { LegalPage } from '@/components/nexus/LegalPage';
import { BRAND } from '@/lib/brand';

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="§ legal — refunds"
      title="Refund + cancellation policy"
      lastUpdated="29 May 2026"
      intro={
        <>
          <p className="m-0">
            This policy explains when and how refunds work for paid listings and boosts on{' '}
            {BRAND.name}, operated by <strong>{BRAND.legalEntity}</strong>. All prices are quoted
            in USD. Payments are processed by PayPal (worldwide) and Cashfree (India).
          </p>
        </>
      }
      sections={[
        {
          id: 'monthly',
          heading: 'Monthly Listing — $10 / month',
          body: (
            <>
              <p className="m-0">
                <strong>7-day refund window.</strong> If you cancel within 7 calendar days of
                your first charge, we refund the full $10. Email{' '}
                <a href={`mailto:${BRAND.supportEmail}`} style={{ color: 'var(--accent)' }}>
                  {BRAND.supportEmail}
                </a>{' '}
                from the address on file, and you will see the credit on the original payment
                method within 7-10 business days.
              </p>
              <p className="mt-3">
                After the 7-day window, the subscription is non-refundable for the current
                billing period. You can cancel auto-renewal any time and your listing stays live
                through the end of the period you have already paid for.
              </p>
            </>
          ),
        },
        {
          id: 'boost-category',
          heading: 'Boost · Category — $12 / 7 days',
          body: (
            <p className="m-0">
              Boost packages start serving impressions as soon as the payment confirms. They are{' '}
              <strong>non-refundable once the boost window has started</strong>. If we are unable
              to start the boost within 24 hours of payment (rare — usually a moderation hold),
              we refund the full amount on request.
            </p>
          ),
        },
        {
          id: 'boost-home',
          heading: 'Boost · Home Rotation — $30 / 7 days',
          body: (
            <p className="m-0">
              Same policy as Boost · Category. Non-refundable once the rotation window has
              started. Refunded in full if we cannot start the boost within 24 hours.
            </p>
          ),
        },
        {
          id: 'featured',
          heading: 'Featured Badge — $60 / 30 days',
          body: (
            <p className="m-0">
              The Featured Badge is non-refundable once the badge has been applied. If we apply
              the badge late (more than 24 hours after payment confirmation), we extend the
              30-day window by the delay.
            </p>
          ),
        },
        {
          id: 'failed-payments',
          heading: 'Failed payments + duplicate charges',
          body: (
            <p className="m-0">
              Our payment-status reconciler runs continuously, so duplicate charges from retried
              webhooks or stuck transactions are automatically detected and reversed. If you see
              a duplicate charge that has not been reversed within 7 business days, email{' '}
              <a href={`mailto:${BRAND.supportEmail}`} style={{ color: 'var(--accent)' }}>
                {BRAND.supportEmail}
              </a>{' '}
              with the transaction ID.
            </p>
          ),
        },
        {
          id: 'cancel',
          heading: 'How to cancel',
          body: (
            <>
              <p className="m-0">
                Sign in, go to your{' '}
                <a href="/dashboard" style={{ color: 'var(--accent)' }}>
                  Dashboard
                </a>
                , and use the &ldquo;Cancel subscription&rdquo; control. Cancellation takes
                effect at the end of the current billing period.
              </p>
              <p className="mt-3">
                You can also email{' '}
                <a href={`mailto:${BRAND.supportEmail}`} style={{ color: 'var(--accent)' }}>
                  {BRAND.supportEmail}
                </a>{' '}
                from the address on file and we will cancel for you.
              </p>
            </>
          ),
        },
        {
          id: 'chargebacks',
          heading: 'Chargebacks',
          body: (
            <p className="m-0">
              Please contact support before initiating a chargeback. We respond to refund
              requests within one business day and will almost always issue a direct refund
              rather than fight a chargeback. Accounts with chargebacks may be suspended pending
              investigation.
            </p>
          ),
        },
        {
          id: 'contact',
          heading: 'Contact',
          body: (
            <p className="m-0">
              <strong>{BRAND.legalEntity}</strong>
              <br />
              Email:{' '}
              <a href={`mailto:${BRAND.supportEmail}`} style={{ color: 'var(--accent)' }}>
                {BRAND.supportEmail}
              </a>
            </p>
          ),
        },
      ]}
    />
  );
}
