import { Sparkles, Calendar, Bookmark } from "lucide-react";
import Image from 'next/image';
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";
import { motion, useReducedMotion } from "framer-motion";
import { staggerCardProps } from "@/lib/animations";

export const Upcoming = () => {
  const { data, isLoading, error } = useTools({ limit: 500, sortBy: 'createdAt', sortOrder: 'desc' });
  const tools = data?.data || [];
  const { toggleSave, isSaved } = useToolActions();
  const [pageSize, setPageSize] = useState(12);
  const reduceMotion = useReducedMotion();

  // Recently Added derivation: tools sorted by createdAt desc, with
  // future-dated tools (createdAt > now) pinned to the top and flagged
  // "Coming Soon". Editorial isUpcoming=true also pins. Means the page
  // is never empty — it shows the launch pipeline when there is one,
  // and the newest catalog additions when there isn't.
  const { recentTools, hasUpcoming } = useMemo(() => {
    const now = Date.now();
    const sorted = [...tools].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const upcoming = sorted.filter(t =>
      t.isUpcoming || (t.createdAt && new Date(t.createdAt).getTime() > now)
    );
    const rest = sorted.filter(t => !upcoming.includes(t));
    return {
      recentTools: [...upcoming, ...rest].slice(0, 50),
      hasUpcoming: upcoming.length > 0,
    };
  }, [tools]);

  const visibleTools = recentTools.slice(0, pageSize);

  const loadMore = () => {
    setPageSize(prev => prev + 12);
  };

  const isFutureTool = (createdAt: string) =>
    !!createdAt && new Date(createdAt).getTime() > Date.now();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24 max-w-4xl">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100/70 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
          ))}
        </div>
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

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-gradient-to-b from-red-50/60 via-white to-white"
      />
      <div className="relative container mx-auto px-4 py-16 mt-20">
        <div className="flex flex-col items-center text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Newest in the catalog
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4">
            Recently <span className="gradient-text">added</span>.
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">
            {hasUpcoming
              ? 'The latest additions, including launches happening soon. Save anything worth coming back to.'
              : 'Fresh tools added to InternetKeeda. Save anything worth coming back to.'}
          </p>
        </div>

      <div className="max-w-4xl mx-auto">
        {visibleTools.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl text-gray-700 mb-4">No tools to show yet.</h3>
            <p className="text-gray-500">New tools are added regularly — check back soon.</p>
          </div>
        ) : (
          visibleTools.map((tool, idx) => {
            const future = isFutureTool(tool.createdAt);
            const saved = isSaved(tool.id);
            return (
              <motion.div
                key={tool.id}
                {...staggerCardProps(idx, reduceMotion)}
                className="relative bg-white rounded-2xl p-6 mb-8 border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg group"
              >
                {future && (
                  <div className="absolute -top-3 right-6 bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Coming Soon
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {tool.name}
                    </h3>
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-blue-50 shadow-sm mb-4 relative">
                      <Image
                        src={tool.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}`}
                        alt={tool.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="text-gray-600 mb-4">
                      {tool.description_ai || tool.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {tool.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        Added {new Date(tool.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant={saved ? "default" : "outline"}
                    className={`rounded-xl ${
                      saved
                        ? "bg-orange-600 text-white hover:bg-orange-700"
                        : "border-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                    } transition-all duration-300 group-hover:shadow-md`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSave(tool.id);
                    }}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    {saved ? "Saved" : "Save"}
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

        {visibleTools.length < recentTools.length && (
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
      </div>
    </div>
  );
} 