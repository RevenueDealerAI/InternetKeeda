import { Users, MessageSquare, ThumbsUp, Eye, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

interface Discussion {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  replies: number;
  views: number;
  likes: number;
  lastActivity: string;
  tags: string[];
}

export const Discussions = () => {
  const discussions: Discussion[] = []; // This would be populated from your data source

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 mb-4">
          <Users className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Community Discussions
        </h1>
        <p className="text-gray-600 max-w-2xl">
          Join the conversation with fellow AI enthusiasts. Share your experiences, ask questions, and learn from others.
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" className="rounded-xl hover:bg-orange-50">
            All Topics
          </Button>
          <Button variant="outline" className="rounded-xl hover:bg-orange-50">
            Questions
          </Button>
          <Button variant="outline" className="rounded-xl hover:bg-orange-50">
            Show & Tell
          </Button>
          <Button variant="outline" className="rounded-xl hover:bg-orange-50">
            Help Wanted
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="rounded-xl hover:bg-orange-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button 
            className="rounded-xl bg-gradient-to-r from-orange-600 to-blue-600 text-white hover:from-orange-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Discussion
          </Button>
        </div>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {discussions.map((discussion) => (
          <div 
            key={discussion.id}
            className="bg-white rounded-2xl border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg p-6"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Author */}
              <div className="flex items-center gap-4 md:w-48">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image 
                    src={discussion.author.avatar} 
                    alt={discussion.author.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {discussion.author.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {discussion.lastActivity}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                    {discussion.category}
                  </span>
                  {discussion.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-orange-600 transition-colors cursor-pointer">
                  {discussion.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {discussion.excerpt}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {discussion.replies} replies
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {discussion.views} views
                  </span>
                  <span className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    {discussion.likes} likes
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center mt-12">
        <Button 
          variant="outline"
          className="rounded-xl hover:bg-orange-50 border-orange-200"
        >
          Load More Discussions
        </Button>
      </div>
    </div>
  );
}; 