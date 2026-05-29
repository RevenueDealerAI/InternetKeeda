'use client';

import { LegalPage } from '@/components/nexus/LegalPage';
import { BRAND } from '@/lib/brand';

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="§ company — about"
      title="About Internet Keeda"
      lastUpdated="29 May 2026"
      intro={
        <>
          <p className="m-0">
            {BRAND.name} is a hand-curated directory of AI tools — 5,000+ tools across writing,
            design, code, audio, video and research. It is opinionated by design. We rank by use,
            not by ad spend.
          </p>
        </>
      }
      sections={[
        {
          id: 'who',
          heading: 'Who runs this',
          body: (
            <>
              <p className="m-0">
                {BRAND.name} is owned and operated by <strong>{BRAND.legalEntity}</strong>, a
                MarTech company registered in India. Day-to-day, the catalog is curated by a
                small team of people who use AI tools daily and have strong opinions about which
                ones actually ship work.
              </p>
              <p className="mt-3">
                We are not a corporate aggregator. There is no SEO farm behind us. There is no
                hidden agenda. We get paid when creators list their tools and when they boost
                their listings, and that is the entire business model.
              </p>
            </>
          ),
        },
        {
          id: 'what',
          heading: 'What we do',
          body: (
            <ul className="m-0 list-disc pl-5">
              <li>Maintain the directory — vet submissions, kill dead links, refresh metadata.</li>
              <li>
                Run AI Keeda (the agent named Eli) — a conversational way to route across the
                index and get a usable stack back, with citations.
              </li>
              <li>
                Publish editorial picks — Top Products, Trending, AI News — based on usage signal
                and human review.
              </li>
              <li>
                Operate the paid tiers — Monthly Listing ($10), Boost Category ($12/7d), Boost
                Home ($30/7d), Featured Badge ($60/30d).
              </li>
            </ul>
          ),
        },
        {
          id: 'values',
          heading: 'How we run it',
          body: (
            <ul className="m-0 list-disc pl-5">
              <li>
                <strong>Curation over scale.</strong> Every tool you see is in the index because
                somebody decided it earned its place. We refuse submissions that misrepresent
                what they do.
              </li>
              <li>
                <strong>Honest pricing.</strong> Listings and boosts are the entire revenue. We
                do not take affiliate kickbacks for ranking choices.
              </li>
              <li>
                <strong>No data sale.</strong> We do not sell personal data. See the{' '}
                <a href="/privacy" style={{ color: 'var(--accent)' }}>
                  Privacy policy
                </a>{' '}
                for the full posture.
              </li>
              <li>
                <strong>Self-healing.</strong> Payment webhooks and listing status reconcilers
                run on a tight loop so a single dropped webhook never strands your subscription.
              </li>
            </ul>
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
              <br />
              Site: <a href="https://internetkeeda.com" style={{ color: 'var(--accent)' }}>{BRAND.domain}</a>
            </p>
          ),
        },
      ]}
    />
  );
}
