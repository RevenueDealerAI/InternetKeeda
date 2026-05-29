'use client';

import { LegalPage } from '@/components/nexus/LegalPage';
import { BRAND } from '@/lib/brand';

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="§ legal — privacy"
      title="Privacy policy"
      lastUpdated="29 May 2026"
      intro={
        <>
          <p className="m-0">
            {BRAND.name} ({BRAND.domain}) is operated by <strong>{BRAND.legalEntity}</strong>.
            This policy explains what data we collect, why we collect it, how long we keep it, and
            the choices you have. We do not sell personal data. Ever.
          </p>
        </>
      }
      sections={[
        {
          id: 'who-we-are',
          heading: 'Who we are',
          body: (
            <p className="m-0">
              {BRAND.name} is a hand-curated directory of AI tools, built and maintained by{' '}
              <strong>{BRAND.legalEntity}</strong>, registered in India. You can reach our team at{' '}
              <a href={`mailto:${BRAND.supportEmail}`} style={{ color: 'var(--accent)' }}>
                {BRAND.supportEmail}
              </a>
              .
            </p>
          ),
        },
        {
          id: 'what-we-collect',
          heading: 'What we collect',
          body: (
            <ul className="m-0 list-disc pl-5">
              <li>
                <strong>Account data.</strong> When you sign in via Clerk (Google, GitHub, email),
                we receive your name, email, and profile image to create your {BRAND.name}{' '}
                account.
              </li>
              <li>
                <strong>Tool submissions.</strong> If you submit a tool, we store everything in
                your submission — title, URL, description, category, your contact name.
              </li>
              <li>
                <strong>Payment metadata.</strong> When you pay for a listing or boost, we receive
                only the metadata our payment partners return (transaction ID, amount, status).
                We never see or store card numbers — those stay with PayPal or Cashfree.
              </li>
              <li>
                <strong>Usage data.</strong> Standard server logs (IP, user agent, referer) and
                anonymous product analytics (page views, feature usage) for understanding what
                works.
              </li>
            </ul>
          ),
        },
        {
          id: 'why-we-collect',
          heading: 'Why we collect it',
          body: (
            <>
              <p className="m-0">
                To run your account, fulfil listings + boosts you paid for, prevent abuse,
                respond to your support requests, and improve the catalog. That is the entire
                list. We do not build advertising profiles, share data with brokers, or run
                third-party trackers on your behaviour.
              </p>
            </>
          ),
        },
        {
          id: 'cookies',
          heading: 'Cookies + local storage',
          body: (
            <ul className="m-0 list-disc pl-5">
              <li>
                <strong>Session cookies (Clerk).</strong> Required to keep you signed in.
              </li>
              <li>
                <strong>Theme preference.</strong> Local storage key{' '}
                <code style={{ fontFamily: 'var(--mono)' }}>ik-theme</code> remembers your
                light/dark choice.
              </li>
              <li>
                <strong>Affiliate attribution.</strong> First-party cookie that records the
                inbound referral so creators get credit.
              </li>
              <li>
                <strong>AI Keeda chat history.</strong> Stored locally on your device so the
                conversation survives reload. Never sent to a third party.
              </li>
            </ul>
          ),
        },
        {
          id: 'payments',
          heading: 'Payments + receipts',
          body: (
            <p className="m-0">
              Card payments are handled by PayPal (worldwide) and Cashfree (India). We receive
              transaction status and amount via webhook; we never see the underlying card.
              Receipts and invoices are sent to the email on your {BRAND.name} account.
            </p>
          ),
        },
        {
          id: 'data-sharing',
          heading: 'Who we share data with',
          body: (
            <ul className="m-0 list-disc pl-5">
              <li>
                <strong>Clerk</strong> — authentication.
              </li>
              <li>
                <strong>PayPal + Cashfree</strong> — payment processing.
              </li>
              <li>
                <strong>MongoDB Atlas</strong> — database hosting.
              </li>
              <li>
                <strong>Vercel</strong> — application hosting.
              </li>
              <li>
                <strong>Resend</strong> — transactional email.
              </li>
            </ul>
          ),
        },
        {
          id: 'your-rights',
          heading: 'Your rights',
          body: (
            <p className="m-0">
              You can request a copy of your data, ask us to delete your account, or correct
              anything inaccurate. Email{' '}
              <a href={`mailto:${BRAND.supportEmail}`} style={{ color: 'var(--accent)' }}>
                {BRAND.supportEmail}
              </a>{' '}
              and we will respond within 30 days. Listings you have purchased and paid for stay
              live for their paid duration; data linked to those transactions is retained for
              tax / audit purposes under Indian law.
            </p>
          ),
        },
        {
          id: 'changes',
          heading: 'Changes to this policy',
          body: (
            <p className="m-0">
              If we change this policy, we update the &ldquo;Last updated&rdquo; date at the top
              of this page and post a note on the home page. Significant changes are also emailed
              to anyone with an active subscription.
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
              <br />
              Site: {BRAND.domain}
            </p>
          ),
        },
      ]}
    />
  );
}
