import { Button } from "@/components/ui/button";
import Link from 'next/link'
import { ProductCard } from "../ProductCard";
import { ArrowRight } from "lucide-react";
const featuredTools = [
  {
    id: "1",
    name: "AI Image Creator Pro",
    slug: "ai-image-creator-pro",
    description: "Create stunning AI-generated images with advanced style controls and editing features.",
    category: "Image Generation",
    votes: 1250,
    imageUrl: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    usersCount: 50000,
    viewsCount: 150000,
    commentsCount: 2500,
    pricing: "Free" as const,
    verifiedProduct: true,
    tags: ["Art", "Design", "Creative"],
    isNew: true,
    launchDate: "2 days ago"
  },
  {
    id: "2",
    name: "SmartWrite AI",
    slug: "smartwrite-ai",
    description: "Advanced AI writing assistant for content creation, editing, and optimization.",
    category: "Writing",
    votes: 980,
    imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    usersCount: 35000,
    viewsCount: 120000,
    commentsCount: 1800,
    pricing: "Freemium" as const,
    verifiedProduct: true,
    tags: ["Content", "Writing", "SEO"],
    isNew: false,
    launchDate: "1 week ago"
  },
  {
    id: "3",
    name: "CodeAssist AI",
    slug: "codeassist-ai",
    description: "AI-powered code completion and refactoring tool for developers.",
    category: "Development",
    votes: 750,
    imageUrl: "https://images.unsplash.com/photo-1542831371-32f555c86880?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    usersCount: 25000,
    viewsCount: 90000,
    commentsCount: 1200,
    pricing: "Paid" as const,
    verifiedProduct: true,
    tags: ["Coding", "Development", "Programming"],
    isNew: true,
    launchDate: "3 days ago"
  }
];

export const FeaturedTools = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/30 via-white to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
            Featured AI Tools
          </h2>
          <p className="text-gray-600">
            Discover our handpicked selection of the most innovative AI tools.
          </p>
        </div>

        {/* Featured Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredTools.map((tool) => (
            <ProductCard
              key={tool.id}
              {...tool}
              onVote={() => {}}
              isFavorite={false}
              onFavorite={() => {}}
              pricing={tool.pricing}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/ai-tools">
            <Button
              size="lg"
              variant="outline"
              className="border-2 hover:bg-green-50 group"
            >
              View All Tools
              <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}; 