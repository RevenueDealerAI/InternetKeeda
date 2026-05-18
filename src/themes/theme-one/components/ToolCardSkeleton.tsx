import { Skeleton } from "@/components/ui/skeleton";

export function ToolCardSkeleton() {
  return (
    <div className="group relative h-full overflow-hidden bg-gradient-to-b from-white to-gray-50/50 border-0 
    shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl backdrop-blur-xl">
      <div className="relative p-6 flex flex-col gap-5">
        {/* Header section */}
        <div className="flex items-start gap-4">
          {/* Logo container */}
          <div className="relative shrink-0">
            <Skeleton className="w-16 h-16 rounded-2xl" />
          </div>

          {/* Title and badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-1">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
} 