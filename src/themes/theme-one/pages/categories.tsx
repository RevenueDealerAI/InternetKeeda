import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";

type Group = { letter: string; items: { name: string; slug: string; toolCount: number }[] };

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"alpha" | "count">("alpha");

  const { data, isLoading, error } = useCategories(true);

  // Build a single normalized list (only categories with >= 1 tool).
  const all = useMemo(() => {
    const list = (data?.data ?? [])
      .map((c) => ({
        name: c.name,
        slug: c.slug || encodeURIComponent(c.name.toLowerCase()),
        toolCount: c.toolCount ?? 0,
      }))
      .filter((c) => c.toolCount > 0);
    return list;
  }, [data]);

  // Apply search filter.
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter((c) => c.name.toLowerCase().includes(q));
  }, [all, searchQuery]);

  // Sorted view — alphabetical (grouped by letter) or by count.
  const sorted = useMemo(() => {
    return sortMode === "count"
      ? [...filtered].sort((a, b) => b.toolCount - a.toolCount)
      : [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, sortMode]);

  // For alphabetical mode, group by first letter for visual chunking.
  const alphaGroups: Group[] = useMemo(() => {
    if (sortMode !== "alpha") return [];
    const groups = new Map<string, Group["items"]>();
    for (const cat of sorted) {
      const first = cat.name[0]?.toUpperCase() ?? "#";
      const key = /^[A-Z]$/.test(first) ? first : "#";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(cat);
    }
    return Array.from(groups.entries())
      .map(([letter, items]) => ({ letter, items }))
      .sort((a, b) => a.letter.localeCompare(b.letter));
  }, [sorted, sortMode]);

  // Header counts: Top 30 highlights for context.
  const top30 = useMemo(
    () => [...all].sort((a, b) => b.toolCount - a.toolCount).slice(0, 30),
    [all]
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="space-y-3">
          <div className="h-10 w-72 bg-gray-100 animate-pulse rounded" />
          <div className="h-5 w-96 bg-gray-100 animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-10">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="text-center min-h-[400px] flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Couldn't load categories</h2>
          <p className="text-gray-600">Refresh the page or try again in a minute.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">All categories</h1>
        <p className="text-gray-600">
          {all.length} categories · {all.reduce((s, c) => s + c.toolCount, 0)} tools indexed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter categories…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
            />
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
            <button
              type="button"
              onClick={() => setSortMode("alpha")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sortMode === "alpha"
                  ? "bg-[#DC2626] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              A–Z
            </button>
            <button
              type="button"
              onClick={() => setSortMode("count")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sortMode === "count"
                  ? "bg-[#DC2626] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Most tools
            </button>
          </div>
        </div>
      </div>

      {/* Top 30 strip (only when no search) */}
      {!searchQuery && sortMode === "alpha" && (
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Featured · top 30 by catalog size
          </h2>
          <div className="flex flex-wrap gap-2">
            {top30.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`}>
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 bg-white border-gray-200 hover:border-[#DC2626] hover:text-[#DC2626] transition-colors cursor-pointer"
                >
                  {c.name}
                  <span className="ml-1.5 text-gray-400">{c.toolCount}</span>
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main listing */}
      {sortMode === "alpha" ? (
        <div className="space-y-10">
          {alphaGroups.map((group) => (
            <section key={group.letter}>
              <div className="flex items-baseline gap-3 mb-4 pb-2 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">{group.letter}</h2>
                <span className="text-sm text-gray-500">{group.items.length} categories</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {group.items.map((c) => (
                  <CategoryTile key={c.slug} cat={c} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sorted.map((c) => (
            <CategoryTile key={c.slug} cat={c} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No categories match &ldquo;{searchQuery}&rdquo;.</p>
          <Button
            variant="link"
            className="text-[#DC2626] mt-2"
            onClick={() => setSearchQuery("")}
          >
            Clear filter
          </Button>
        </div>
      )}
    </div>
  );
}

function CategoryTile({ cat }: { cat: { name: string; slug: string; toolCount: number } }) {
  return (
    <Link
      href={`/category/${cat.slug}`}
      className="ik-cat-tile group block h-full rounded-2xl"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-sm)',
        transition:
          'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), ' +
          'box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1), ' +
          'border-color 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
      }}
    >
      <Card
        className="h-full border-0 bg-transparent"
        style={{ boxShadow: 'none', background: 'transparent' }}
      >
        <CardHeader className="pb-2">
          <CardTitle
            className="text-base font-semibold line-clamp-2 transition-colors"
            style={{ color: 'var(--ink)' }}
          >
            {cat.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>
              {cat.toolCount} {cat.toolCount === 1 ? 'tool' : 'tools'}
            </span>
            <ArrowRight
              className="w-4 h-4 transition-all"
              style={{ color: 'var(--ink-dim)' }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
