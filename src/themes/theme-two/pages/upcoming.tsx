import { Star, Calendar, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Image from 'next/image';
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";
import { motion, AnimatePresence } from "framer-motion";

export const Upcoming = () => {
  const { data, isLoading, error } = useTools({ limit: 500 });
  const tools = data?.data || [];
  const { toggleSave, isSaved } = useToolActions();
  const [pageSize, setPageSize] = useState(9);
  const [subscriberCounts, setSubscriberCounts] = useState<{ [key: string]: number }>({});

  // Get only upcoming tools
  const upcomingTools = tools.filter(tool => tool.isUpcoming);
  const visibleTools = upcomingTools.slice(0, pageSize);

  // Initialize subscriber counts for any new tools
  useState(() => {
    const initialCounts = upcomingTools.reduce((acc, tool) => ({
      ...acc,
      [tool.id]: acc[tool.id] || 0
    }), subscriberCounts);
    
    if (Object.keys(initialCounts).length !== Object.keys(subscriberCounts).length) {
      setSubscriberCounts(initialCounts);
    }
  });

  const loadMore = () => {
    setPageSize(prev => prev + 9);
  };

  const handleSubscribe = (toolId: string) => {
    // Use the toggleSave function from useToolActions
    toggleSave(toolId);
    
    // Update the local subscriber count for immediate UI feedback
    setSubscriberCounts(prev => ({
      ...prev,
      [toolId]: isSaved(toolId) 
        ? Math.max(0, (prev[toolId] || 0) - 1) 
        : (prev[toolId] || 0) + 1
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
    <motion.div 
      className="theme-two min-h-screen bg-gradient-to-b relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8 mt-20 relative">
        {/* Header */}
        <motion.div 
          className="flex flex-col items-center text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 mb-4">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#8039fd] via-[#a855f7] to-[#f5a5ad] bg-clip-text text-transparent">Upcoming AI Tools</span>
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            Get a sneak peek at the most anticipated AI tools launching soon. Subscribe to be notified when they go live.
          </p>
        </motion.div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto">
        {visibleTools.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl text-gray-700 mb-4">No upcoming tools available at the moment.</h3>
            <p className="text-gray-500">Check back soon for new announcements!</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="relative h-full p-[1px] rounded-[1.25rem] overflow-hidden transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl" style={{
                  background: index % 2 === 0 
                    ? 'linear-gradient(to bottom, #7D37FF 0%, rgba(255, 255, 255, 0) 100%)'
                    : 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #7D37FF 100%)'
                }}>
                  <div className="relative h-full bg-gradient-to-br from-gray-50 to-white rounded-[1.25rem] p-6 group-hover:bg-white transition-colors duration-300 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-50 shadow-lg ring-2 ring-purple-100 flex items-center justify-center relative">
                            <Image
                              src={tool.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=8039fd&color=fff&bold=true&format=svg&size=128`}
                              alt={tool.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1 shadow-md">
                            <Calendar className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-gray-500">{tool.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {tool.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{tool.rating || '4.5'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{subscriberCounts[tool.id] || 0}</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSubscribe(tool.id);
                        }}
                        size="sm"
                        className={`rounded-full ${
                          isSaved(tool.id)
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                            : "border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                        } transition-all duration-300 flex items-center gap-1`}
                      >
                        <Bell className="w-3 h-3" />
                        {isSaved(tool.id) ? "Subscribed" : "Notify"}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Load More */}
      {visibleTools.length < upcomingTools.length && (
        <div className="flex justify-center mt-12">
          <Button 
            variant="outline"
            className="rounded-full px-8 h-12 hover:bg-purple-50 border-purple-200 relative z-50 cursor-pointer font-medium"
            onClick={loadMore}
          >
            Load More Tools
          </Button>
        </div>
      )}
      </div>
    </motion.div>
  );
} 