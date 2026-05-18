import { useState, useEffect, useRef } from "react";
import Image from 'next/image';
import { X, Search } from "lucide-react";
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
      <DialogContent className="p-0 gap-0 overflow-hidden w-full max-w-2xl bg-white border-0 rounded-3xl shadow-[0px_100px_80px_0px_rgba(0,0,0,0.01),0px_41.778px_33.422px_0px_rgba(0,0,0,0.02),0px_22.336px_17.869px_0px_rgba(0,0,0,0.02),0px_12.522px_10.017px_0px_rgba(0,0,0,0.02),0px_6.65px_5.32px_0px_rgba(0,0,0,0.03),0px_2.767px_2.214px_0px_rgba(0,0,0,0.04)]">
        <DialogTitle className="sr-only">Search for AI tools</DialogTitle>
        <div className="flex items-center p-6">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-5 h-5 w-5 text-gray-400 z-10" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for any tool or feature..."
              className="pl-12 h-14 w-full border border-gray-200 text-base rounded-full bg-white focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 pr-10 transition-all shadow-[1px_1px_20px_-5px_rgba(0,0,0,0.30)]"
            />
            {query && (
              <button 
                onClick={handleClearSearch}
                className="absolute right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && query.trim() && (
          <div className="py-12 text-center text-gray-500">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 font-medium">Searching...</span>
            </div>
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && !isLoading && (
          <div className="py-2 max-h-[70vh] overflow-y-auto">
            {searchResults.map((tool, index) => (
              <div 
                key={tool.id || tool._id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all rounded-2xl mx-2"
                onClick={() => handleSelectTool(tool)}
                style={{
                  marginTop: index > 0 ? '4px' : '0',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center border border-gray-100 relative">
                    {tool.logo ? (
                      <Image 
                        src={getToolLogo(tool as Tool)} 
                        alt={tool.name} 
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg">
                        {tool.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{tool.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{tool.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {query.trim() && searchResults.length === 0 && !isLoading && (
          <div className="py-16 text-center text-gray-500">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9-.796-5.263-2.099M9 8H7a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2h-2" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">No results found for "{query}"</p>
            <p className="text-sm mt-2 text-gray-500">Try different keywords or check the spelling</p>
          </div>
        )}

        {/* Empty state */}
        {!query.trim() && (
          <div className="py-16 text-center text-gray-500">
            <div className="mb-4">
              <Search className="w-16 h-16 mx-auto text-purple-500" />
            </div>
            <p className="text-gray-700 font-medium text-lg">Type to search through 12,000+ AI tools</p>
            <p className="text-sm mt-2 text-gray-500">Search by name, description, or category</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full">Example: "ChatGPT"</span>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full">Example: "video editing"</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 