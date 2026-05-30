'use client';

import { LegalPage } from '@/components/nexus/LegalPage';
import { LegalEntityBlock } from '@/components/nexus/LegalEntityBlock';
import { WhatsAppSupportButton } from '@/components/nexus/WhatsAppSupportButton';
import { BRAND, LEGAL_ENTITIES } from '@/lib/brand';

const LAST_UPDATED = '2026-05-30';

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="§ legal — privacy"
      title="Privacy policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <p className="m-0">
          This policy explains what {BRAND.name} collects, why, and the
          rights you have over your data. We operate under India&apos;s
          Digital Personal Data Protection Act 2023 (DPDP), the EU General
          Data Protection Regulation (GDPR) for EU users, and the California
          Consumer Privacy Act (CCPA) for California users.
        </p>
      }
      sections={[
        {
          id: 'who-we-are',
          heading: 'Who we are',
          body: (
            <>
              <p className="m-0">
                {BRAND.name} is operated by{' '}
                <strong>{LEGAL_ENTITIES.inr.name}</strong> (Indian merchant of
                record, INR transactions via Cashfree) and{' '}
                <strong>{LEGAL_ENTITIES.usd.name}</strong> (US merchant of
                record, USD transactions via PayPal). The UK corporate
                reference for the group is{' '}
                <strong>{LEGAL_ENTITIES.uk.name}</strong>.
              </p>
              <p className="mt-3">
                Data Protection Officer:{' '}
                <a href={`mailto:${BRAND.corpEmail}`} style={{ color: 'var(--accent)' }}>
                  {BRAND.corpEmail}
                </a>{' '}
                — kept as an email channel because DPDP / GDPR rights
                exercise expects regulator-grade written correspondence.
                Day-to-day product and support contact goes through
                WhatsApp (see Contact below).
              </p>
            </>
          ),
        },
        {
          id: 'what-we-collect',
          heading: 'Data we collect',
          body: (
            <ul className="m-0 list-disc pl-5">
              <li>
                <strong>Account data</strong> via Clerk: email address, name,
                profile photo, and any OAuth provider IDs (Google, GitHub)
                you connect.
              </li>
              <li>
                <strong>Submission data</strong>: tool name, description, URL,
                logo, screenshots, category, tags you submit.
              </li>
              <li>
                <strong>Payment data</strong>: handled by Cashfree (INR) and
                PayPal (USD). We never see or store full card numbers — we
                receive a payment id, status, and the amount/currency.
              </li>
              <li>
                <strong>Usage data</strong> via PostHog: page views, feature
                usage, anonymized IP, browser/device class.
              </li>
            </ul>
          ),
        },
        {
          id: 'how-we-use',
          heading: 'How we use data',
          body: (
            <p className="m-0">
              Service delivery (showing the directory, processing payments,
              activating boosts), billing and tax records, fraud and abuse
              prevention, product analytics, and — only if you opt in —
              marketing email. You can opt out of marketing email at any
              time via the unsubscribe link in the message or by asking us
              on WhatsApp (see Contact below).
            </p>
          ),
        },
        {
          id: 'legal-basis',
          heading: 'Legal basis (GDPR)',
          body: (
            <p className="m-0">
              We rely on: <strong>contract performance</strong> for account
              and payment data, <strong>legitimate interest</strong> for
              security, fraud prevention, and product analytics, and{' '}
              <strong>consent</strong> for marketing email. You can withdraw
              consent at any time without affecting processing already done.
            </p>
          ),
        },
        {
          id: 'sharing',
          heading: 'Sharing',
          body: (
            <>
              <p className="m-0">
                We share the minimum data necessary with these processors,
                each operating under our control:
              </p>
              <ul className="mt-3 list-disc pl-5">
                <li><strong>Clerk</strong> — authentication & session.</li>
                <li><strong>MongoDB Atlas</strong> — primary database.</li>
                <li><strong>Cashfree</strong> — INR payment processing.</li>
                <li><strong>PayPal</strong> — USD payment processing.</li>
                <li><strong>Cloudinary</strong> — image hosting (logos, screenshots).</li>
                <li><strong>Vercel</strong> — application hosting & CDN.</li>
                <li><strong>PostHog</strong> — product analytics.</li>
              </ul>
              <p className="mt-3">
                We do not sell personal data. We do not share data with
                third-party advertising networks.
              </p>
            </>
          ),
        },
        {
          id: 'retention',
          heading: 'Data retention',
          body: (
            <ul className="m-0 list-disc pl-5">
              <li>
                <strong>Account data</strong>: until account deletion + 90
                days (allows recovery / dispute window).
              </li>
              <li>
                <strong>Payment records</strong>: 7 years (tax & accounting
                compliance under Indian and US law).
              </li>
              <li>
                <strong>Analytics</strong>: 12 months.
              </li>
              <li>
                <strong>Support email</strong>: 2 years after the conversation
                closes.
              </li>
            </ul>
          ),
        },
        {
          id: 'your-rights',
          heading: 'Your rights',
          body: (
            <>
              <p className="m-0">
                You have the right to access, correct, delete, and port your
                personal data, and to object to certain processing. Indian
                users have these rights under the DPDP Act; EU users under
                GDPR Articles 15-22; California users under the CCPA.
              </p>
              <p className="mt-3">
                To exercise your data rights, reach us on WhatsApp from the
                account address (or include the account email in the first
                message so we can verify). We respond within 30 days (DPDP /
                GDPR) or 45 days (CCPA), and may extend by the statutory
                grace period if the request is complex.
              </p>
              <div className="mt-4">
                <WhatsAppSupportButton label="Exercise data rights on WhatsApp" />
              </div>
              <p className="mt-4 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
                For formal written data requests (regulator escalation,
                power-of-attorney representation), write to:{' '}
                {LEGAL_ENTITIES.inr.address}
              </p>
            </>
          ),
        },
        {
          id: 'cookies',
          heading: 'Cookies',
          body: (
            <p className="m-0">
              We use essential cookies for authentication (Clerk session),
              analytics cookies via PostHog (anonymized), and payment-iframe
              cookies set by Cashfree and PayPal during checkout. A cookie
              consent banner is provided where local law requires it.
            </p>
          ),
        },
        {
          id: 'children',
          heading: 'Children',
          body: (
            <p className="m-0">
              {BRAND.name} is not intended for users under 18. We do not
              knowingly collect personal data from minors. If you believe a
              minor has signed up, reach us on WhatsApp (see Contact below)
              and we will delete the account.
            </p>
          ),
        },
        {
          id: 'transfers',
          heading: 'International transfers',
          body: (
            <p className="m-0">
              Data may be processed in the United States, the European Union,
              and India depending on which processor handles it. Cross-border
              transfers rely on Standard Contractual Clauses (SCCs) for
              EU-origin data, and on equivalent contractual safeguards for
              data covered by the DPDP Act.
            </p>
          ),
        },
        {
          id: 'security',
          heading: 'Security',
          body: (
            <p className="m-0">
              All traffic uses TLS. Secrets and password equivalents are
              hashed (or held only by Clerk). Access to production data is
              restricted by least-privilege roles; deploys and database
              writes are audit-logged.
            </p>
          ),
        },
        {
          id: 'changes',
          heading: 'Changes & contact',
          body: (
            <>
              <p className="m-0">
                This policy is versioned by the &ldquo;Last updated&rdquo;
                date at the top. Material changes are notified by email to
                anyone with an active subscription.
              </p>
              <p className="mt-3">Need help? Reach us on WhatsApp.</p>
              <div className="mt-4">
                <WhatsAppSupportButton />
              </div>
              <p
                className="mt-4 text-[13px]"
                style={{ color: 'var(--ink-soft)' }}
              >
                For formal written data requests, write to:{' '}
                {LEGAL_ENTITIES.inr.address}
              </p>
              <div className="mt-6">
                <LegalEntityBlock includeUK />
              </div>
            </>
          ),
        },
      ]}
    />
  );
}
