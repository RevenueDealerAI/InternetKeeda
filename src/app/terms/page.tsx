import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & conditions',
  description: 'Terms governing use of Internet Keeda, the AI tools directory.',
  alternates: { canonical: '/terms' },
  openGraph: { url: '/terms', title: 'Terms & conditions', description: 'Terms governing use of Internet Keeda, the AI tools directory.' },
};

import { LegalPage } from '@/components/nexus/LegalPage';
import { LegalEntityBlock } from '@/components/nexus/LegalEntityBlock';
import { WhatsAppSupportButton } from '@/components/nexus/WhatsAppSupportButton';
import { BRAND, LEGAL_ENTITIES, LEGAL_JURISDICTION } from '@/lib/brand';

const LAST_UPDATED = '2026-05-30';

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Â§ legal â€” terms"
      title="Terms & conditions"
      lastUpdated={LAST_UPDATED}
      intro={
        <p className="m-0">
          These terms govern your use of {BRAND.name} ({BRAND.domain}). The
          merchant of record depends on the currency of your transaction â€”
          INR charges settle with{' '}
          <strong>{LEGAL_ENTITIES.inr.name}</strong> via Cashfree; USD charges
          settle with <strong>{LEGAL_ENTITIES.usd.name}</strong> via PayPal.
          The {BRAND.name} brand is operated by both entities. By using the
          site you agree to these terms.
        </p>
      }
      sections={[
        {
          id: 'about',
          heading: 'About InternetKeeda',
          body: (
            <p className="m-0">
              {BRAND.name} is a directory of AI tools â€” we let creators submit
              tools, let visitors discover them, and let creators pay for
              higher placement. We do not own, host, or operate the tools
              listed in the directory; we describe them.
            </p>
          ),
        },
        {
          id: 'accounts',
          heading: 'Accounts',
          body: (
            <p className="m-0">
              Accounts are managed by Clerk. Provide accurate information at
              sign-up, keep your sign-in credentials private, and notify us
              on WhatsApp if you suspect unauthorized access. You may delete
              your account at any time from your dashboard; data retention
              after deletion is described in the Privacy Policy.
            </p>
          ),
        },
        {
          id: 'submissions',
          heading: 'Tool submissions',
          body: (
            <p className="m-0">
              When you submit a tool you affirm that you have the IP rights
              or usage rights necessary to publish the tool&apos;s name,
              description, logo, and screenshots on {BRAND.name}. We reserve
              the right to reject or remove any listing â€” with or without
              notice â€” for any reason, including violations of this section,
              quality concerns, or fit with the catalog.
            </p>
          ),
        },
        {
          id: 'paid-services',
          heading: 'Paid services',
          body: (
            <>
              <p className="m-0">
                Two payment types exist on {BRAND.name}:
              </p>
              <ul className="mt-3 list-disc pl-5">
                <li>
                  <strong>One-time Boost payments.</strong> Pay for a placement
                  slot (Category top / Home rotation / Featured badge) that
                  runs for a fixed duration once payment confirms.
                </li>
                <li>
                  <strong>Recurring Monthly Listing subscription.</strong>{' '}
                  Authorize a mandate (Cashfree e-mandate for INR; PayPal
                  subscription for USD) that auto-renews monthly until you
                  cancel.
                </li>
              </ul>
              <p className="mt-3">
                Current pricing is visible at{' '}
                <a href="/pricing" style={{ color: 'var(--accent)' }}>
                  /pricing
                </a>
                . Pricing may change; existing subscriptions remain at the
                rate locked at sign-up.
              </p>
            </>
          ),
        },
        {
          id: 'acceptable-use',
          heading: 'Acceptable use',
          body: (
            <p className="m-0">
              You agree not to submit spam, misrepresent a tool, submit tools
              you do not have rights to list, or scrape the site at scale.
              Bulk-fetch behavior is rate-limited and may trigger automated
              blocks; persistent abuse may result in IP-level bans and
              listing removal.
            </p>
          ),
        },
        {
          id: 'ip',
          heading: 'Intellectual property',
          body: (
            <p className="m-0">
              {BRAND.name} content â€” site copy, taxonomy, editorial picks,
              design â€” is owned by the operating entities listed above.
              Tool-specific content you submit (name, description, logo,
              screenshots) remains yours; by submitting it you grant{' '}
              {BRAND.name} a non-exclusive, worldwide, royalty-free license
              to display, distribute, and modify it for the purpose of
              operating the directory.
            </p>
          ),
        },
        {
          id: 'disclaimer',
          heading: 'Disclaimer & limitation of liability',
          body: (
            <p className="m-0">
              The directory is provided <strong>as-is</strong>. We do not
              endorse listed tools, do not guarantee their fitness for any
              purpose, and are not responsible for actions taken or losses
              incurred based on listings. To the maximum extent permitted by
              law, the operating entities&apos; aggregate liability to you for
              any claim is capped at the amount you have paid to{' '}
              {BRAND.name} in the twelve months preceding the claim.
            </p>
          ),
        },
        {
          id: 'termination',
          heading: 'Termination',
          body: (
            <p className="m-0">
              We may suspend or terminate any listing or account that violates
              these terms or the acceptable-use rules above. Where suspension
              affects a paid subscription, the cancellation rules in the{' '}
              <a href="/refund" style={{ color: 'var(--accent)' }}>
                Refund Policy
              </a>{' '}
              apply.
            </p>
          ),
        },
        {
          id: 'governing-law',
          heading: 'Governing law & jurisdiction',
          body: (
            <p className="m-0">
              For customers in India, these terms are governed by the laws of
              India and disputes are subject to the exclusive jurisdiction of
              the {LEGAL_JURISDICTION.india}. For international customers,
              these terms are governed by the laws of{' '}
              {LEGAL_JURISDICTION.international} and disputes are subject to
              the exclusive jurisdiction of its courts.
            </p>
          ),
        },
        {
          id: 'changes',
          heading: 'Changes to these terms',
          body: (
            <p className="m-0">
              We may update these terms. Material changes will be notified by
              email to anyone with an active subscription, and surfaced as a
              banner inside the user dashboard. Continued use after the change
              means you accept the new terms.
            </p>
          ),
        },
        {
          id: 'contact',
          heading: 'Contact',
          body: (
            <>
              <p className="m-0">Need help? Reach us on WhatsApp.</p>
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
