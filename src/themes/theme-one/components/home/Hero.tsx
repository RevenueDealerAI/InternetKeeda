import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, ArrowRight, Zap, Star, TrendingUp } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const popularSearches = [
  "AI Image Generation",
  "ChatGPT Alternatives",
  "Text to Speech",
  "Code Generation",
  "Video Creation"
];

const stats = [
  { value: "1,000+", label: "AI Tools" },
  { value: "50K+", label: "Active Users" },
  { value: "100K+", label: "Monthly Visits" },
  { value: "4.9", label: "Average Rating" }
];

export const Hero = () => {
  const [searchText, setSearchText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingText, setTypingText] = useState("");
  const words = useMemo(() => ["AI Tools", "Innovations", "Future", "Technology"], []);
  const typingDelay = 150;
  const deletingDelay = 100;
  const pauseDelay = 2000;

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const type = () => {
      const current = words[currentWordIndex];
      
      if (isDeleting) {
        setTypingText(current.substring(0, typingText.length - 1));
      } else {
        setTypingText(current.substring(0, typingText.length + 1));
      }

      let delay = isDeleting ? deletingDelay : typingDelay;

      if (!isDeleting && typingText === current) {
        delay = pauseDelay;
        setIsDeleting(true);
      } else if (isDeleting && typingText === "") {
        setIsDeleting(false);
        setCurrentWordIndex((currentWordIndex + 1) % words.length);
      }

      timeout = setTimeout(type, delay);
    };

    timeout = setTimeout(type, typingDelay);
    return () => clearTimeout(timeout);
  }, [typingText, isDeleting, currentWordIndex, words]);

  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50 via-white to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-[10%] animate-float-slow">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-blue-500/20 backdrop-blur-xl rotate-12" />
      </div>
      <div className="absolute top-40 right-[15%] animate-float-slower">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-orange-500/20 backdrop-blur-xl" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 pt-24 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-orange-50 border border-orange-100 shadow-sm space-x-2">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Discover the Best AI Tools</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Explore the World of{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-orange-600 via-fuchsia-500 to-blue-600 bg-clip-text text-transparent">
                {typingText}
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-600/50 via-fuchsia-500/50 to-blue-600/50 blur-sm" />
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-orange-600 via-fuchsia-500 to-blue-600" />
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your premier destination for discovering cutting-edge AI tools. Find, compare, and implement the perfect AI solutions for your needs.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative flex bg-white rounded-lg shadow-lg p-2">
              <Input
                type="text"
                placeholder="Search AI tools..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 border-0 focus:ring-0 text-lg placeholder:text-gray-400"
              />
              <Button className="bg-gradient-to-r from-orange-600 via-fuchsia-500 to-blue-600 text-white shadow-lg hover:shadow-orange-500/25 transition-all duration-500">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
            
            {/* Popular Searches */}
            <div className="mt-4 flex items-center gap-2 flex-wrap justify-center text-sm text-gray-500">
              <span className="font-medium">Popular:</span>
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setSearchText(search)}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-white/50 border border-gray-200/50 hover:border-orange-200 hover:bg-orange-50 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2 group">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-600 via-fuchsia-500 to-blue-600 text-white shadow-lg hover:shadow-orange-500/25 transition-all duration-500 group"
            >
              <TrendingUp className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              Trending Tools
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 hover:bg-orange-50 group"
            >
              <Star className="w-5 h-5 mr-2 text-yellow-500 group-hover:scale-110 transition-transform" />
              Featured Tools
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 hover:bg-orange-50 group"
            >
              <Zap className="w-5 h-5 mr-2 text-blue-500 group-hover:rotate-12 transition-transform" />
              Latest Additions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 