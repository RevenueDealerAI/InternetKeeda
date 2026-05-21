import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, ArrowUp, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PricingType = 'Free' | 'Freemium' | 'Paid';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  votes: number;
  imageUrl: string;
  onVote: (e?: React.MouseEvent) => void;
  isFavorite?: boolean;
  onFavorite?: (e: React.MouseEvent) => void;
  pricing: PricingType;
  isNew?: boolean;
  index?: number;
  /** Active paid boosts on this listing. Featured-badge shows a red-
   * gradient pill alongside the existing Trending/New cues. */
  activeBoosts?: Array<"category-top" | "home-rotation" | "featured-badge">;
}

const PRICING_STYLES: Record<PricingType, string> = {
  Free:     "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  Freemium: "bg-indigo-50 text-indigo-700 ring-indigo-200/60",
  Paid:     "bg-orange-50 text-orange-700 ring-orange-200/60",
};

const formatNumber = (num: number) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
};

/** Phase D Tier 3 — white card with gray-200 border, animated gradient
 * border (orange → violet → indigo) that fades in on hover, -4px lift,
 * shadow grow. Category and pricing chips have tinted backgrounds. */
export const ProductCard = ({
  slug,
  name,
  description,
  category,
  votes,
  imageUrl,
  onVote,
  isFavorite,
  onFavorite,
  pricing = 'Free',
  isNew = false,
  activeBoosts,
}: ProductCardProps) => {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    router.push(`/ai-tools/${slug}`);
  };

  // Card hover: pure CSS (translate-y + shadow grow). Previously used
  // framer-motion's whileHover which costs runtime per card — at 60
  // cards on a home grid that's measurable on mobile.
  return (
    <article
      onClick={handleCardClick}
      className="gradient-border group relative h-full bg-white rounded-2xl border border-gray-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-xl hover:shadow-red-500/15 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-200 ease-out cursor-pointer overflow-hidden motion-reduce:transform-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo in a soft gradient halo */}
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-red-100 via-red-50 to-gray-100 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" aria-hidden />
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-gray-50 ring-1 ring-gray-200/80 group-hover:ring-orange-200 transition-all duration-200">
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DC2626&color=fff&bold=true&format=svg`;
                }}
              />
            </div>
            {isNew && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide bg-gradient-to-r from-orange-500 to-orange-600 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                <Sparkles className="w-2.5 h-2.5" />
                New
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
              {name}
            </h3>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center text-[11px] font-medium bg-gray-50 text-gray-600 ring-1 ring-gray-200/60 px-2 py-0.5 rounded-full">
                {category}
              </span>
              <span className={cn(
                "inline-flex items-center text-[11px] font-medium ring-1 px-2 py-0.5 rounded-full",
                PRICING_STYLES[pricing] ?? PRICING_STYLES.Paid
              )}>
                {pricing}
              </span>
              {activeBoosts?.includes("featured-badge") && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gradient-to-r from-orange-500 to-red-600 text-white ring-1 ring-red-500/30 px-2 py-0.5 rounded-full shadow-[0_2px_8px_-2px_rgba(220,38,38,0.4)]">
                  <Sparkles className="w-2.5 h-2.5" />
                  Featured
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 line-clamp-2 mt-3 leading-relaxed">
              {description}
            </p>

            {/* Action row — Tailwind: 44px tap targets on mobile (h-11),
              * compact 36px (h-9) on sm+. The whole card is clickable so
              * "View" is optional on mobile — collapse to just Vote + Save
              * under sm. */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="h-11 sm:h-9 flex-1 border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors"
                onClick={onVote}
              >
                <ArrowUp className="w-3.5 h-3.5 mr-1.5" />
                {formatNumber(votes)}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex h-11 sm:h-9 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/ai-tools/${slug}`);
                }}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View
              </Button>

              {onFavorite && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onFavorite}
                  className={cn(
                    "h-11 w-11 sm:h-9 sm:w-9 p-0",
                    isFavorite ? "text-amber-500" : "text-gray-400 hover:text-amber-500"
                  )}
                  aria-label={isFavorite ? "Remove from saved" : "Save tool"}
                >
                  <Star className={cn("w-4 h-4", isFavorite && "fill-amber-500")} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
