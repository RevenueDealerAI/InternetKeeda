import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Filter,
  Search,
  X,
  Check,
  ArrowUpDown,
  Star,
  Sparkles,
  Clock,
  TrendingUp,
  Zap,
  Bookmark,
  LayoutGrid,
  Menu,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category = {
  value: string;
  label: string;
  count?: number;
};

type SortOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

type PricingType = "Free" | "Freemium" | "Paid" | "All";
type RatingType = 1 | 2 | 3 | 4 | 5 | null;
type SpecialFilterType = "new" | "trending" | "bookmarked" | null;

interface FilterBarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  searchQuery: string;
  onSearch: (value: string) => void;
  resetFilters: () => void;
  totalResults: number;
  onSearchOpen?: () => void;
  selectedPricing?: PricingType;
  onPricingChange?: (value: PricingType) => void;
  selectedRating?: RatingType;
  onRatingChange?: (value: RatingType) => void;
  selectedSpecialFilter?: SpecialFilterType;
  onSpecialFilterChange?: (value: SpecialFilterType) => void;
}

export function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearch,
  resetFilters,
  totalResults,
  onSearchOpen,
  selectedPricing,
  onPricingChange,
  selectedRating,
  onRatingChange,
  selectedSpecialFilter,
  onSpecialFilterChange,
}: FilterBarProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Sort options with icons
  const sortOptions: SortOption[] = [
    { value: "trending", label: "Trending", icon: <TrendingUp className="w-4 h-4" /> },
    { value: "newest", label: "Newest", icon: <Clock className="w-4 h-4" /> },
    { value: "popular", label: "Most Popular", icon: <Zap className="w-4 h-4" /> },
    { value: "rating", label: "Top Rated", icon: <Star className="w-4 h-4" /> },
  ];

  const shouldShowReset = useMemo(() => {
    return selectedCategory !== "all" || sortBy !== "trending" || !!searchQuery || (selectedPricing && selectedPricing !== "All") || !!selectedRating || !!selectedSpecialFilter;
  }, [selectedCategory, sortBy, searchQuery, selectedPricing, selectedRating, selectedSpecialFilter]);

  useEffect(() => {
    setShowReset(shouldShowReset);
  }, [shouldShowReset]);

  // Handle pricing filter change
  const handlePricingChange = (value: PricingType) => {
    onPricingChange?.(value);
  };

  // Handle rating filter change
  const handleRatingChange = (value: RatingType) => {
    onRatingChange?.(value);
  };

  // Handle special filter change
  const handleSpecialFilterChange = (value: SpecialFilterType) => {
    onSpecialFilterChange?.(value);
  };

  return (
    <div className="w-full mb-8">
      <div className="flex flex-col gap-5">
        {/* Top bar - Search, Categories dropdown, Sort */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left side: Search + Categories */}
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
            {/* Search bar with keyboard shortcut */}
            <div 
              onClick={onSearchOpen}
              className="relative w-full sm:max-w-xs group cursor-pointer"
            >
              <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white transition-all hover:border-green-500/50 group-hover:shadow-sm">
                <Search className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-500 flex-1 truncate">
                  {searchQuery || "Search tools..."}
                </span>
                <kbd className="hidden sm:flex h-5 select-none items-center gap-1 rounded border border-gray-100 bg-gray-100/60 px-1.5 font-mono text-[10px] font-medium text-gray-600">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>

            {/* Category dropdown */}
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  aria-label="Select a category"
                  className="justify-between w-full sm:w-auto bg-white border-gray-200 hover:bg-gray-50 hover:border-green-500/50 hover:text-green-700 h-11"
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-gray-500" />
                    <span className="truncate">
                      {selectedCategory === "all"
                        ? "All Categories"
                        : categories.find((category) => category.value === selectedCategory)?.label || "All Categories"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[300px] z-[9999]" align="start">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandList>
                    <ScrollArea className="h-[300px]">
                      <CommandGroup>
                        <CommandItem
                          key="all"
                          value="all"
                          onSelect={() => {
                            onCategoryChange("all");
                            setCategoryOpen(false);
                          }}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4 text-gray-500" />
                            <span>All Categories</span>
                          </div>
                          {selectedCategory === "all" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </CommandItem>
                        {categories
                          .filter((category) => category.value !== "all")
                          .map((category) => (
                            <CommandItem
                              key={category.value}
                              value={category.value}
                              onSelect={() => {
                                onCategoryChange(category.value);
                                setCategoryOpen(false);
                              }}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="truncate">{category.label}</span>
                                {category.count && (
                                  <Badge variant="outline" className="ml-auto">
                                    {category.count}
                                  </Badge>
                                )}
                              </div>
                              {selectedCategory === category.value && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </ScrollArea>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right side: Sort + Advanced Filters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Sort dropdown */}
            <Popover open={sortOpen} onOpenChange={setSortOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={sortOpen}
                  aria-label="Sort by"
                  className="justify-between w-full sm:w-auto bg-white border-gray-200 hover:bg-gray-50 hover:border-green-500/50 hover:text-green-700 h-11"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-gray-500" />
                    <span>
                      {sortOptions.find((option) => option.value === sortBy)?.label || "Sort By"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[200px] z-[9999]" align="end">
                <Command>
                  <CommandList>
                    <CommandGroup heading="Sort By">
                      {sortOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            onSortChange(option.value);
                            setSortOpen(false);
                          }}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-2">
                            {option.icon}
                            <span>{option.label}</span>
                          </div>
                          {sortBy === option.value && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Advanced Filter Button */}
            <Button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="outline"
              className={cn(
                "h-11 bg-white border-gray-200 hover:bg-gray-50 hover:border-green-500/50 hover:text-green-700",
                showAdvancedFilters && "bg-green-50 text-green-700 border-green-200"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </div>

        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div
            className="w-full bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pricing Filter */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-3">Pricing</h3>
                <div className="flex flex-wrap gap-2">
                  {["All", "Free", "Freemium", "Paid"].map((option) => (
                    <Badge
                      key={option}
                      variant={(selectedPricing || "All") === option ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer hover:bg-green-50 h-8",
                        (selectedPricing || "All") === option 
                          ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" 
                          : "text-gray-700 hover:text-green-700 border-gray-200"
                      )}
                      onClick={() => handlePricingChange(option as PricingType)}
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-3">Minimum Rating</h3>
                <div className="flex items-center gap-4">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <Button
                      key={rating}
                      variant={selectedRating === rating ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 px-3 gap-1",
                        selectedRating === rating
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200"
                          : "bg-white border-gray-200 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200"
                      )}
                      onClick={() => handleRatingChange(selectedRating === rating ? null : rating as RatingType)}
                    >
                      <span>{rating}</span>
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Special Filters */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-3">Show Only</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={selectedSpecialFilter === "new" ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer h-8",
                      selectedSpecialFilter === "new"
                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                        : "bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border-gray-200"
                    )}
                    onClick={() => handleSpecialFilterChange(selectedSpecialFilter === "new" ? null : "new")}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> New Tools
                  </Badge>
                  <Badge
                    variant={selectedSpecialFilter === "trending" ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer h-8",
                      selectedSpecialFilter === "trending"
                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                        : "bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border-gray-200"
                    )}
                    onClick={() => handleSpecialFilterChange(selectedSpecialFilter === "trending" ? null : "trending")}
                  >
                    <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Trending
                  </Badge>
                  <Badge
                    variant={selectedSpecialFilter === "bookmarked" ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer h-8",
                      selectedSpecialFilter === "bookmarked"
                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                        : "bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border-gray-200"
                    )}
                    onClick={() => handleSpecialFilterChange(selectedSpecialFilter === "bookmarked" ? null : "bookmarked")}
                  >
                    <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Bookmarked
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters & Results Count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">
            Showing <span className="font-medium text-gray-900">{totalResults}</span> results
          </span>
          
          {/* Active filters */}
          {showReset && (
            <div className="flex items-center gap-2 ml-2">
              {selectedCategory !== "all" && (
                <Badge 
                  variant="secondary" 
                  className="px-2 py-0 h-6 bg-green-50 hover:bg-green-100 gap-1.5 group"
                >
                  <span>{categories.find(c => c.value === selectedCategory)?.label}</span>
                  <X 
                    className="h-3 w-3 text-gray-500 group-hover:text-green-700" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onCategoryChange("all");
                    }}
                  />
                </Badge>
              )}
              
              {sortBy !== "trending" && (
                <Badge 
                  variant="secondary" 
                  className="px-2 py-0 h-6 bg-green-50 hover:bg-green-100 gap-1.5 group"
                >
                  <span>{sortOptions.find(s => s.value === sortBy)?.label}</span>
                  <X 
                    className="h-3 w-3 text-gray-500 group-hover:text-green-700" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSortChange("trending");
                    }}
                  />
                </Badge>
              )}
              
              {selectedPricing !== "All" && (
                <Badge 
                  variant="secondary" 
                  className="px-2 py-0 h-6 bg-green-50 hover:bg-green-100 gap-1.5 group"
                >
                  <span>{selectedPricing}</span>
                  <X 
                    className="h-3 w-3 text-gray-500 group-hover:text-green-700" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onPricingChange?.("All");
                    }}
                  />
                </Badge>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="h-6 px-2.5 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                Reset all
              </Button>
            </div>
          )}
        </div>
        
        {/* View options would go here */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-white border border-gray-200">
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-white border border-gray-200">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 