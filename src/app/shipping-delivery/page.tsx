'use client';

import { LegalPage } from '@/components/nexus/LegalPage';
import { LegalEntityBlock } from '@/components/nexus/LegalEntityBlock';
import { WhatsAppSupportButton } from '@/components/nexus/WhatsAppSupportButton';
import { BRAND } from '@/lib/brand';

const LAST_UPDATED = '2026-05-30';

export default function ShippingDeliveryPage() {
  return (
    <LegalPage
      eyebrow="§ legal — shipping & delivery"
      title="Shipping & delivery"
      lastUpdated={LAST_UPDATED}
      intro={
        <p className="m-0">
          {BRAND.name} is a digital service. This page exists because
          Cashfree, Razorpay, and similar gateways require a published
          delivery policy as part of merchant onboarding — even for products
          that are never physically shipped.
        </p>
      }
      sections={[
        {
          id: 'nature',
          heading: 'Nature of service',
          body: (
            <p className="m-0">
              {BRAND.name} is a digital directory of AI tools. We deliver
              listings, boost placements, and a subscription dashboard.{' '}
              <strong>No physical goods are shipped.</strong>
            </p>
          ),
        },
        {
          id: 'service-delivery',
          heading: 'Service delivery',
          body: (
            <>
              <p className="m-0">
                Boost activation is typically delivered within minutes of a
                successful payment. Subscriptions activate on payment
                confirmation. A confirmation email is sent to the address on
                your account immediately after the gateway settles the
                transaction.
              </p>
            </>
          ),
        },
        {
          id: 'delays',
          heading: 'Activation delays',
          body: (
            <p className="m-0">
              In rare cases — payment-gateway webhook delays or queue
              backlogs — activation may take up to 24 hours. If you do not
              see your boost or subscription activated within 24 hours,
              reach us on WhatsApp with the transaction reference and we
              will reconcile manually.
            </p>
          ),
        },
        {
          id: 'geography',
          heading: 'Geographic availability',
          body: (
            <p className="m-0">
              The service is available globally, subject to local laws and
              the payment-method coverage of our gateways (Cashfree for INR;
              PayPal for USD).
            </p>
          ),
        },
        {
          id: 'contact',
          heading: 'Contact for delivery issues',
          body: (
            <>
              <p className="m-0">
                Need help with activation? Reach us on WhatsApp with the
                transaction reference and a brief description of the issue.
              </p>
              <div className="mt-4">
                <WhatsAppSupportButton />
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
