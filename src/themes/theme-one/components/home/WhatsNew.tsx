import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Calendar, Users, Sparkles, Star, Clock } from "lucide-react";

const updates = [
  {
    id: 1,
    title: "New AI Tools Added",
    description: "We've added 50+ new AI tools across various categories this week.",
    date: "2 days ago",
    type: "addition",
    icon: Sparkles,
    color: "purple"
  },
  {
    id: 2,
    title: "Community Milestone",
    description: "Our community has grown to over 50,000 AI enthusiasts!",
    date: "5 days ago",
    type: "milestone",
    icon: Users,
    color: "blue"
  },
  {
    id: 3,
    title: "Platform Updates",
    description: "Enhanced search functionality and improved tool recommendations.",
    date: "1 week ago",
    type: "update",
    icon: Star,
    color: "green"
  },
  {
    id: 4,
    title: "Coming Soon",
    description: "Exciting new features and integrations launching next week!",
    date: "2 weeks ago",
    type: "upcoming",
    icon: Clock,
    color: "orange"
  }
];

export const WhatsNew = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-purple-50/30 to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            What's New
          </h2>
          <p className="text-gray-600">
            Stay up to date with the latest updates and additions to our platform.
          </p>
        </div>

        {/* Updates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {updates.map((update) => (
            <Card
              key={update.id}
              className="group relative overflow-hidden bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-purple-200/50 transition-all duration-300"
            >
              {/* Hover Background */}
              <div className={`absolute inset-0 bg-gradient-to-r from-${update.color}-500/5 to-${update.color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="p-6 space-y-4">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-${update.color}-50 text-${update.color}-500 group-hover:scale-110 transition-transform duration-300`}>
                  <update.icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {update.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {update.description}
                  </p>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{update.date}</span>
                </div>

                {/* Learn More Link */}
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    className="p-0 h-auto text-purple-600 hover:text-purple-700 hover:bg-transparent group/btn"
                  >
                    Learn more
                    <ArrowRight className="ml-2 w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              {/* Hover Border */}
              <div className="absolute inset-x-0 bottom-0 h-0.5">
                <div className={`h-full bg-gradient-to-r from-${update.color}-500 to-${update.color}-400 w-0 group-hover:w-full transition-all duration-500`} />
              </div>
            </Card>
          ))}
        </div>

        {/* View All Updates Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-2 hover:bg-purple-50 group"
          >
            View All Updates
            <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}; 