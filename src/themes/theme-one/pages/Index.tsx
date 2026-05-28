'use client';

import { useMemo } from 'react';
import { useTools } from '@/lib/api/tools';
import { useCategories } from '@/hooks/useCategories';
import { Nav } from '@/components/editorial/Nav';
import { Hero } from '@/components/editorial/Hero';
import { FeaturedGrid } from '@/components/editorial/FeaturedGrid';
import { Sections } from '@/components/editorial/Sections';
import { Pricing } from '@/components/editorial/Pricing';
import { Footer } from '@/components/editorial/Footer';

export default function Index() {
  // Real catalog counts feed the hero pill + stat strip.
  // We keep API contracts/data intact — only the visual surface changes.
  const { data: toolsData } = useTools({ limit: 60, status: 'published' });
  const { data: categoriesData } = useCategories(true, 200);

  const toolCount = useMemo(
    () => toolsData?.pagination?.totalCount ?? toolsData?.data?.length ?? 0,
    [toolsData?.pagination?.totalCount, toolsData?.data?.length],
  );
  const categoryCount = useMemo(
    () => categoriesData?.data?.length ?? 0,
    [categoriesData?.data?.length],
  );

  return (
    <div className="relative min-h-screen">
      <Nav />
      <main>
        <Hero toolCount={toolCount || 5247} categoryCount={categoryCount || 42} />
        <FeaturedGrid />
        <Sections />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
