import Link from 'next/link';
import { BreadcrumbSSR } from '@/components/seo/BreadcrumbSSR';

/**
 * Server-rendered category index for /categories.
 *
 * Same soft-404 fix as ToolArticleSSR: the themed categories hub
 * (ThemeOneCategories, a client component) fetches its list in the
 * browser, so the raw HTML was an empty shell with zero category
 * links — an orphan-inducing dead end for crawlers. This renders the
 * full set of category links as real HTML in the initial response,
 * handed to the client view as its loading fallback and swapped for
 * the interactive grid on hydration.
 *
 * Pure server component. Doubles as the crawl hub that distributes
 * PageRank to all 678 /category/{slug} pages (and through them to the
 * ~5,000 tool pages).
 */

export interface CategoryListItem {
  slug: string;
  name: string;
}

export function CategoryListSSR({ categories }: { categories: CategoryListItem[] }) {
  return (
    <main style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <BreadcrumbSSR
        items={[
          { label: 'Internet Keeda', href: '/' },
          { label: 'Categories' },
        ]}
      />
      <div className="mx-auto w-full max-w-[1320px] px-7 py-8">
        <h1
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ letterSpacing: '-0.03em' }}
        >
          AI tool categories
        </h1>
        <p className="mt-3 max-w-2xl text-base" style={{ color: 'var(--ink-2)' }}>
          Browse {categories.length}+ categories of AI tools — writing, design,
          code, audio, video, research and more. Pick a category to see the
          tools indexed under it.
        </p>

        <ul
          className="mt-8 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3"
          style={{ color: 'var(--ink-2)' }}
        >
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/category/${c.slug}`}
                className="hover:underline"
                style={{ color: 'var(--ink-2)' }}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
