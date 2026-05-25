import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import Image from 'next/image';
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSearchTools } from "@/lib/api/tools";
import { Tool } from "@/types/tool";
import { useDebounce } from "use-debounce";
import { getToolLogo } from "@/utils/toolHelpers";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTool?: (tool: Tool) => void;
}

export const SearchDialog = ({ 
  open, 
  onOpenChange,
  onSelectTool
}: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search query to avoid too many API calls
  const [debouncedQuery] = useDebounce(query, 300);
  
  // Use normal search to find tools by name, description, or category
  const { data: searchResults = [], isLoading } = useSearchTools(debouncedQuery, 50);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelectTool = (tool: Tool) => {
    if (onSelectTool) {
      onSelectTool(tool);
    }
    setQuery("");
    onOpenChange(false);
  };

  const handleClearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-2xl">
        <DialogTitle className="sr-only">Search for AI tools</DialogTitle>
        <div className="flex items-center p-4 border-b border-gray-100">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-4 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for any tool or feature..."
              className="pl-12 h-12 w-full border border-gray-200 text-base rounded-full bg-gray-50 focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 pr-10"
            />
            {query && (
              <button 
                onClick={handleClearSearch}
                className="absolute right-3 p-1.5 rounded-full hover:bg-gray-200"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && query.trim() && (
          <div className="py-8 text-center text-gray-500">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching...</span>
            </div>
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && !isLoading && (
          <div className="py-4 max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
            {searchResults.map((tool) => (
              <div 
                key={tool.id || tool._id}
                className="px-6 py-5 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleSelectTool(tool)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
                    {tool.logo ? (
                      <Image
                        src={getToolLogo(tool as Tool)}
                        alt={tool.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-green-100 text-green-800 flex items-center justify-center font-bold">
                        {tool.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">{tool.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3 leading-relaxed">{tool.description_ai || tool.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {query.trim() && searchResults.length === 0 && !isLoading && (
          <div className="py-16 text-center text-gray-500">
            <p>No results found for "{query}"</p>
            <p className="text-sm mt-2">Try different keywords or check the spelling</p>
          </div>
        )}

        {/* Empty state */}
        {!query.trim() && (
          <div className="py-16 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium text-gray-700">Type to search through 12,000+ AI tools</p>
            <p className="text-sm mt-2 text-gray-500">Search by name, description, or category</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">Example: "ChatGPT"</span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">Example: "video editing"</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 