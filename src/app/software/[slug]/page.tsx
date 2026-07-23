import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import SoftwareDetailClient from './ClientView';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const title = `${slug} — software on ${BRAND.name}`;
  const description = BRAND.defaultMetaDescription;
  return {
    // `absolute` bypasses the root layout's `%s · Internet Keeda`
    // template so the brand isn't duplicated in the title.
    title: { absolute: title },
    description,
    alternates: { canonical: `/software/${slug}` },
    openGraph: { url: `/software/${slug}`, title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    // /software/* is a legacy route group:
    //   - Fully client-rendered (useTheme + useTools), so the initial
    //     HTML is an empty shell — Googlebot sees a soft 404.
    //   - Not linked from the public nav (SoftwareSidebar uses broken
    //     relative hrefs that only resolve from /software/* itself),
    //     so the pages are functionally orphaned.
    // Until the SSR rewrite ships, tell Google not to index — `follow`
    // stays so any anchor tags the client renders still flow PageRank.
    // Drop this once the page renders real content in the initial HTML
    // and is linked from a discoverable hub.
    robots: { index: false, follow: true },
  };
}

export default async function SoftwareDetailPage({ params }: RouteParams) {
  const { slug } = await params;
  return <SoftwareDetailClient slug={slug} />;
}
