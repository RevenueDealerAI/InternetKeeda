import { Card } from "@/components/ui/card";
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image';
import { Star, ArrowUpCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
}

export const ProductCard = ({
  id,
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
  index = 0,
}: ProductCardProps) => {
  const router = useRouter();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  const getPricingColor = (type: string) => {
    switch (type) {
      case 'Free': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Freemium': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Paid': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return '';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/ai-tools/${slug}`);
  };

  return (
    <Card 
      className="group h-full overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-5">
        <div className="flex items-start space-x-4">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200 relative">
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="48px"
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true&format=svg`;
                }}
              />
            </div>
            {isNew && (
              <div className="absolute -top-1 -right-1">
                <Badge className="bg-purple-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                  New
                </Badge>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[18px] font-medium text-gray-900 truncate mb-1">
              {name}
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs font-normal">
                {category}
              </Badge>
              <Badge className={cn("text-xs font-normal border", getPricingColor(pricing))}>
                {pricing}
              </Badge>
            </div>
            <p className="text-base text-gray-600 line-clamp-2 mb-4">
              {description}
            </p>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-700"
                onClick={onVote}
              >
                <ArrowUpCircle className="w-4 h-4 mr-1.5" />
                {formatNumber(votes)}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="flex items-center border-gray-200 hover:bg-gray-50 text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/ai-tools/${slug}`, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                View
              </Button>
              
              {onFavorite && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onFavorite}
                  className={cn(
                    "p-2 h-9 w-9",
                    isFavorite ? "text-pink-500" : "text-gray-400 hover:text-pink-500"
                  )}
                >
                  <Star className={cn("w-5 h-5", isFavorite && "fill-pink-500")} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};