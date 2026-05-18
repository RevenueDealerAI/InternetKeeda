import { useState, useMemo } from "react";
import Link from 'next/link'
import { Grid, MessageSquare, Image, Code, Video, Music, Brain, Bot, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTools } from "@/lib/api/tools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  count: number;
  filterValue: string;
}

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch tools from API with pagination
  const { data, isLoading, error } = useTools({ limit: 1000 });
  const tools = useMemo(() => data?.data || [], [data?.data]);

  // Get unique categories and their counts
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    tools.forEach(tool => {
      const category = tool.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tools]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Categories</h2>
            <p className="text-gray-600">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse by Categories</h1>
        <p className="text-gray-600 mb-6">
          Explore AI tools organized by categories. Find the perfect tool for your needs.
        </p>
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.map((category) => (
          <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href={`/category/${encodeURIComponent(category.name.toLowerCase())}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {category.count} tool{category.count !== 1 ? 's' : ''}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                  >
                    Explore →
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-gray-500">No categories found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
} 