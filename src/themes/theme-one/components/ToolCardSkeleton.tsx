/**
 * Skeleton card matching the inline tool-card layout used in
 * theme-one/pages/Index.tsx. The shape DOM mirrors the real card 1:1
 * (h-[320px], same padding, same rows) so there is zero layout shift
 * when real data swaps in.
 *
 * Shimmer comes from Tailwind's animate-shimmer keyframe defined in
 * tailwind.config.ts — a single moving gradient sweep at 1.5s loop.
 * The base color is gray-200 (light) / gray-800 (dark) and the sweep
 * is a soft white-translucent diagonal.
 */

import { cn } from "@/lib/utils";

interface ToolCardSkeletonProps {
  className?: string;
}

/**
 * Internal shimmering shape — used for every rounded rectangle inside
 * the skeleton card. Pass a height / width via className.
 */
function Shape({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-gray-200 via-gray-100/70 to-gray-200 dark:from-gray-800 dark:via-gray-700/70 dark:to-gray-800 bg-[length:200%_100%] animate-shimmer",
        className,
      )}
    />
  );
}

export function ToolCardSkeleton({ className }: ToolCardSkeletonProps) {
  return (
    <div
      className={cn(
        "relative h-[320px] rounded-2xl bg-white/90 backdrop-blur-md shadow-[0_2px_8px_-2px_rgba(22,23,24,0.05)] ring-1 ring-inset ring-gray-200 overflow-hidden",
        className,
      )}
    >
      <div className="relative p-6 flex flex-col h-full">
        {/* Header — logo + title/rating column */}
        <div className="flex items-start gap-4 mb-3">
          {/* 16x16 logo, rounded-xl per spec */}
          <Shape className="w-16 h-16 rounded-xl shrink-0" />

          <div className="flex-1 min-w-0 space-y-2 pt-1">
            {/* Title bar — 60% width, h-5 per spec */}
            <Shape className="h-5 w-3/5 rounded-md" />
            {/* Rating / subtitle — 40% width, h-3 per spec */}
            <Shape className="h-3 w-2/5 rounded-md" />
          </div>
        </div>

        {/* Description — 2 lines, full + 80% per spec */}
        <div className="space-y-2 mb-3">
          <Shape className="h-3 w-full rounded-md" />
          <Shape className="h-3 w-4/5 rounded-md" />
        </div>

        {/* Tag pills — 2 pills side-by-side, ~20% each, h-6 per spec */}
        <div className="flex gap-2 mb-4">
          <Shape className="h-6 w-1/5 rounded-lg" />
          <Shape className="h-6 w-[22%] rounded-lg" />
        </div>

        {/* Bottom stats — top border + two small rectangles ~15% each */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <Shape className="h-4 w-[15%] rounded" />
          <Shape className="h-4 w-[15%] rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Responsive grid of skeleton cards. Matches the real tool-grid's
 * grid-cols / gap exactly so transition from skeleton → real cards is
 * invisible to the user.
 *
 * Default count: 8 (fills a 3-col desktop grid above the fold).
 * For the dashboard saved/upvoted tabs which use a 3-col grid with
 * 6 visible page size, pass count={6}.
 */
export function ToolCardSkeletonGrid({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton variant for the Dashboard saved / upvoted tabs. The cards
 * there are content-sized (no description tail, simpler footer), so a
 * tighter ~180px box matches the real layout.
 */
export function DashboardToolSkeleton() {
  return (
    <div className="relative bg-white rounded-3xl p-6 shadow-sm ring-1 ring-black/[0.08] overflow-hidden">
      <div className="flex items-start gap-4">
        <Shape className="w-16 h-16 rounded-2xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-2 pt-1">
          <Shape className="h-5 w-3/5 rounded-md" />
          <Shape className="h-3 w-4/5 rounded-md" />
          <Shape className="h-3 w-2/3 rounded-md" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Shape className="h-6 w-20 rounded-full" />
        <Shape className="h-4 w-10 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Compact skeleton card for the AI search recommendation panel
 * (hero popover). The real recommendation list uses small horizontal
 * rows, not 320px tiles — so this skeleton mirrors that shape.
 */
export function AiRecommendationSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-start">
      <Shape className="w-10 h-10 rounded-md shrink-0 mr-3" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <Shape className="h-4 w-3/5 rounded-md" />
          <Shape className="h-3 w-8 rounded-md" />
        </div>
        <Shape className="h-3 w-full rounded-md" />
        <Shape className="h-3 w-4/5 rounded-md" />
        <Shape className="h-4 w-16 rounded-full mt-1" />
      </div>
    </div>
  );
}
