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
    title,
    description,
    alternates: { canonical: `/software/${slug}` },
    openGraph: { url: `/software/${slug}`, title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function SoftwareDetailPage({ params }: RouteParams) {
  const { slug } = await params;
  return <SoftwareDetailClient slug={slug} />;
}
