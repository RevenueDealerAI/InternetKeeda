'use client';

import { LegalPage } from '@/components/nexus/LegalPage';
import { BRAND } from '@/lib/brand';

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="§ legal — terms"
      title="Terms of service"
      lastUpdated="29 May 2026"
      intro={
        <>
          <p className="m-0">
            These terms govern your use of {BRAND.name} ({BRAND.domain}), operated by{' '}
            <strong>{BRAND.legalEntity}</strong>. By accessing or using the site you agree to be
            bound by these terms. If you do not agree, please do not use the site.
          </p>
        </>
      }
      sections={[
        {
          id: 'service',
          heading: 'The service',
          body: (
            <p className="m-0">
              {BRAND.name} is a directory of AI tools. We let creators submit tools, let visitors
              discover them, and let creators pay for higher placement (Boost) or a featured
              badge. We do not own, host, or operate the tools listed in the directory — we
              describe them.
            </p>
          ),
        },
        {
          id: 'eligibility',
          heading: 'Who can use it',
          body: (
            <p className="m-0">
              You must be at least 16 years old to use {BRAND.name}. By submitting a tool you
              warrant that you have the right to publish the content you submit, and that the
              tool you list is real and operational.
            </p>
          ),
        },
        {
          id: 'accounts',
          heading: 'Accounts',
          body: (
            <p className="m-0">
              You are responsible for activity on your account. Keep your sign-in credentials
              private. If you lose access, contact{' '}
              <a href={`mailto:${BRAND.supportEmail}`} style={{ color: 'var(--accent)' }}>
                {BRAND.supportEmail}
              </a>{' '}
              and we will help you recover.
            </p>
          ),
        },
        {
          id: 'paid-listings',
          heading: 'Paid listings + boosts',
          body: (
            <ul className="m-0 list-disc pl-5">
              <li>
                <strong>Monthly Listing — $10 / month.</strong> Your tool stays in the public
                catalog as long as the subscription is active.
              </li>
              <li>
                <strong>Boost · Category Top — $12 / 7 days.</strong> Top placement in your
                tool&apos;s category for the boost window.
              </li>
              <li>
                <strong>Boost · Home Rotation — $30 / 7 days.</strong> Rotation slot on the
                homepage Launches grid for the boost window.
              </li>
              <li>
                <strong>Featured Badge — $60 / 30 days.</strong> Featured badge on every surface
                + editorial mention + newsletter inclusion.
              </li>
            </ul>
          ),
        },
        {
          id: 'payments',
          heading: 'Payments + currency',
          body: (
            <p className="m-0">
              All prices are quoted in USD. Payments are processed by PayPal (worldwide) and
              Cashfree (India). For Indian users, charges may appear on your statement in INR at
              the conversion rate set by Cashfree on the transaction date. Subscriptions
              auto-renew until cancelled.
            </p>
          ),
        },
        {
          id: 'refunds',
          heading: 'Refunds',
          body: (
            <p className="m-0">
              Boost packages (Category / Home / Featured) are non-refundable once the boost
              window has started. For Monthly Listing, refunds are available within 7 days of the
              first charge — email{' '}
              <a href={`mailto:${BRAND.supportEmail}`} style={{ color: 'var(--accent)' }}>
                {BRAND.supportEmail}
              </a>
              . After 7 days, you can cancel any time and your listing stays live through the end
              of the current billing period.
            </p>
          ),
        },
        {
          id: 'editorial-control',
          heading: 'Editorial control',
          body: (
            <p className="m-0">
              We reserve the right to remove, edit, or refuse to publish any submission that
              violates our guidelines, infringes someone else&apos;s rights, contains scams,
              malware, or hate content, or that misrepresents what the tool actually does. We are
              opinionated; the catalog reflects our taste.
            </p>
          ),
        },
        {
          id: 'liability',
          heading: 'No warranty, limited liability',
          body: (
            <p className="m-0">
              {BRAND.name} is provided as-is. We do not guarantee that any listed tool is fit for
              your purpose, secure, or available. To the maximum extent permitted by law,{' '}
              {BRAND.legalEntity} is not liable for indirect or consequential damages arising
              from your use of the site or any tool you discover through it.
            </p>
          ),
        },
        {
          id: 'jurisdiction',
          heading: 'Governing law',
          body: (
            <p className="m-0">
              These terms are governed by the laws of India. Any disputes are subject to the
              exclusive jurisdiction of courts in the operator&apos;s registered city.
            </p>
          ),
        },
        {
          id: 'changes',
          heading: 'Changes to these terms',
          body: (
            <p className="m-0">
              We may update these terms. Significant changes will be emailed to anyone with an
              active subscription and noted on the home page. Continued use of the site after the
              change means you accept the new terms.
            </p>
          ),
        },
        {
          id: 'contact',
          heading: 'Contact',
          body: (
            <p className="m-0">
              {BRAND.legalEntity}
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
