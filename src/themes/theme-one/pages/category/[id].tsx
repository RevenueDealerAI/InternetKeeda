import { useEffect, useState } from "react";
import { useParams as useNextParams } from 'next/navigation'
import { useContext } from 'react'
import { ParamsContext } from '@/lib/react-router-compat'
import { usePathname, useSearchParams } from 'next/navigation'
import { ProductCard } from "../../components/ProductCard";
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";
import { useInViewReveal } from "@/hooks/useInViewReveal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ToolCardSkeletonGrid } from "../../components/ToolCardSkeleton";
import { getToolLogo } from "@/utils/toolHelpers";

export default function CategoryPage() {
  const contextParams = useContext(ParamsContext);
  const nextParams = useNextParams();
  const params = { ...contextParams, ...nextParams } as { id?: string };
  const { id } = params;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname: pathname || '/', search: searchParams ? `?${searchParams.toString()}` : '', hash: '', state: null };
  const { data, isLoading, error } = useTools({ limit: 1000 });
  const tools = data?.data || [];
  const { toggleUpvote, isUpvoted, toggleSave, isSaved } = useToolActions();
  const [pageSize, setPageSize] = useState(9);

  // Get category name from state or from ID
  const categoryFromState = location.state?.category;
  const [categoryName, setCategoryName] = useState<string>("");
  const [categoryIntro, setCategoryIntro] = useState<string>("");

  // Resolve canonical category name + intro from the API.
  // The URL is a slug ("image-generation") but Tool.category stores the
  // canonical display name ("Image Generation"), so we MUST look up the
  // canonical name server-side before filtering.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/categories/${encodeURIComponent(id)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const name = json?.data?.name;
        if (typeof name === 'string' && name.length > 0) {
          setCategoryName(name);
        }
        const intro = json?.data?.intro;
        if (typeof intro === 'string' && intro.length > 0) {
          setCategoryIntro(intro);
        }
      } catch {
        // Silent — fall back to state/slug below.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    // Fallbacks only — the API effect above is the source of truth.
    // 1) If we navigated from a card with state.category, prefer that
    //    (avoids a flash of empty state while the fetch is in flight).
    // 2) Otherwise decode the slug as a last-resort string.
    if (categoryName) return;
    if (categoryFromState) {
      setCategoryName(categoryFromState);
    } else if (id) {
      setCategoryName(decodeURIComponent(id));
    }
  }, [id, categoryFromState, categoryName]);

  // Match tools against either the canonical category NAME or the
  // URL slug. The server now writes Tool.category as the canonical
  // name (the seed convention) — legacy Phase B rows that stored the
  // slug are still rendered correctly thanks to this dual-key match.
  const slugFromId = id ? decodeURIComponent(id).toLowerCase() : "";
  const nameSlug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const filteredTools = tools.filter(tool => {
    const allowedStatuses = ['published', 'approved'] as const;
    if (!allowedStatuses.includes(tool.status as typeof allowedStatuses[number])) {
      return false;
    }
    if (!tool.category) return false;
    const toolSlug = nameSlug(tool.category);
    if (categoryName && toolSlug === nameSlug(categoryName)) return true;
    if (slugFromId && toolSlug === slugFromId) return true;
    return false;
  });

  const visibleTools = filteredTools.slice(0, pageSize);

  useInViewReveal([visibleTools.length]);

  const handleVote = (e: React.MouseEvent | undefined, toolId: string, currentVotes: number = 0) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    toggleUpvote(toolId, currentVotes);
  };

  const handleFavorite = (toolId: string) => {
    toggleSave(toolId);
  };

  const loadMore = () => {
    setPageSize(prev => prev + 9);
  };

  const convertPricingType = (type: string): 'Free' | 'Freemium' | 'Paid' => {
    const normalized = type.toLowerCase();
    switch (normalized) {
      case 'free': return 'Free';
      case 'freemium': return 'Freemium';
      case 'paid':
      case 'enterprise': return 'Paid';
      default: return 'Paid';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="h-10 w-64 mb-8 bg-gradient-to-r from-gray-200 via-gray-100/70 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-md" />
        <ToolCardSkeletonGrid count={9} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Tools</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  const getFriendlyCategoryName = () => categoryName;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-to-b from-orange-50/50 via-white to-white"
      />

      <div className="relative container mx-auto px-4 py-16 mt-20">
        <div className="mb-10 max-w-3xl">
          <Button
            variant="ghost"
            className="mb-4 -ml-3 text-gray-600 hover:text-gray-900"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 mb-3">
            Category
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4">
            {getFriendlyCategoryName()}
          </h1>
          {categoryIntro ? (
            <p className="text-gray-700 leading-relaxed text-lg max-w-3xl">
              {categoryIntro}
            </p>
          ) : (
            <p className="text-gray-600 text-lg">
              Explore the best AI tools for {getFriendlyCategoryName().toLowerCase()}.
            </p>
          )}
          <p className="mt-3 text-sm text-gray-500">
            {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} listed
          </p>
        </div>

        {filteredTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">No tools found in this category</h2>
            <p className="text-gray-600 mb-6">We couldn&rsquo;t find any tools in this category at the moment.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleTools.map((tool, index) => {
                // Load-More chunks 9 cards; restart stagger per chunk.
                const batchIndex = index % 9;
                return (
                  <div
                    key={tool.id}
                    className="card-reveal"
                    style={{ transitionDelay: `${batchIndex * 40}ms` }}
                  >
                    <ProductCard
                      id={tool.id}
                      slug={tool.slug}
                      name={tool.name}
                      description={tool.description_ai || tool.description}
                      category={tool.category}
                      votes={tool.votes}
                      imageUrl={getToolLogo(tool)}
                      onVote={(e) => handleVote(e, tool.id, tool.votes)}
                      isFavorite={isSaved(tool.id)}
                      onFavorite={(e) => {
                        e.preventDefault();
                        handleFavorite(tool.id);
                      }}
                      pricing={convertPricingType(tool.pricing.type)}
                      isNew={tool.isNew}
                      activeBoosts={tool.activeBoosts}
                    />
                  </div>
                );
              })}
            </div>

            {visibleTools.length < filteredTools.length && (
              <div className="flex justify-center mt-12">
                <Button
                  variant="outline"
                  className="rounded-xl hover:bg-orange-50 border-orange-200"
                  onClick={loadMore}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
