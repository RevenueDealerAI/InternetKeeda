import { Star, Calendar, Bell } from "lucide-react";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";
import { motion, useReducedMotion } from "framer-motion";
import { staggerCardProps } from "@/lib/animations";
import { ToolCardSkeletonGrid } from "../components/ToolCardSkeleton";

export const Upcoming = () => {
  const { data, isLoading, error } = useTools({ limit: 500 });
  const tools = data?.data || [];
  const { toggleSave, isSaved } = useToolActions();
  const [pageSize, setPageSize] = useState(9);
  const reduceMotion = useReducedMotion();
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
    <div className="container mx-auto px-4 py-8 mt-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 mb-4">
          <Star className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Upcoming AI Tools
        </h1>
        <p className="text-gray-600 max-w-2xl">
          Get a sneak peek at the most anticipated AI tools launching soon. Subscribe to be notified when they go live.
        </p>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto">
        {visibleTools.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl text-gray-700 mb-4">No upcoming tools available at the moment.</h3>
            <p className="text-gray-500">Check back soon for new announcements!</p>
          </div>
        ) : (
          visibleTools.map((tool, idx) => (
            <motion.div
              key={tool.id}
              {...staggerCardProps(idx, reduceMotion)}
              className="relative bg-white rounded-2xl p-6 mb-8 border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg group"
            >
              {/* Launch Date Badge */}
              <div className="absolute -top-3 right-6 bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Coming Soon
              </div>

              {/* Content */}
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
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {tool.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {subscriberCounts[tool.id] || 0} subscribers
                    </span>
                  </div>
                </div>

                {/* Subscribe Button */}
                <Button 
                  variant={isSaved(tool.id) ? "default" : "outline"}
                  className={`rounded-xl ${
                    isSaved(tool.id)
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "border-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                  } transition-all duration-300 group-hover:shadow-md`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubscribe(tool.id);
                  }}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {isSaved(tool.id) ? "Subscribed" : "Get Notified"}
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Load More */}
      {visibleTools.length < upcomingTools.length && (
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
  );
} 