import { useEffect } from 'react';
import Link from 'next/link'
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useSoftwarePages } from '@/contexts/SoftwarePagesContext';
import { 
  Zap, 
  PenTool, 
  Users, 
  Mail,
  CalendarClock,
  Briefcase,
  Target,
  Brain,
  MessageSquare,
  BarChart3,
  FileText,
  Folder,
  Github,
  Headphones,
  Image,
  ArrowRight,
  LucideIcon,
  CheckCircle,
  Clock,
  Database,
  ExternalLink,
  Laptop,
  LineChart,
  Pencil,
  Share2,
  ShieldCheck,
  Sparkles,
  Star
} from 'lucide-react';

// Improved icon mapping with more icons
const iconComponents: Record<string, LucideIcon> = {
  Zap,
  PenTool,
  Users,
  Mail, 
  CalendarClock,
  Briefcase,
  Target,
  Brain,
  MessageSquare,
  BarChart3,
  FileText,
  Folder,
  Github,
  Headphones,
  Image,
  ArrowRight,
  CheckCircle,
  Clock,
  Database,
  ExternalLink,
  Laptop,
  LineChart,
  Pencil,
  Share2,
  ShieldCheck,
  Sparkles,
  Star
};

export const SoftwareCategories = () => {
  const { pages, isLoading, refreshPages } = useSoftwarePages();
  
  // Fetch software pages on mount
  useEffect(() => {
    refreshPages();
  }, [refreshPages]);
  
  // Only show featured pages
  const featuredPages = pages.filter(page => page.featured);
  
  // Create animation variants for staggered animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // Helper function to safely get icon component
  const getIconComponent = (iconName: string | undefined): LucideIcon => {
    if (!iconName) return Zap;
    
    // Try to find the icon in our map
    const IconComponent = iconComponents[iconName];
    
    // If not found, return Zap as fallback
    return IconComponent || Zap;
  };
  
  if (isLoading) {
    return (
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-full max-w-md mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  if (featuredPages.length === 0) {
    return null;
  }
  
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-4">
            AI Software Categories
          </h2>
          <p className="text-gray-600">
            Explore curated lists of the best AI tools for different use cases
          </p>
        </div>
        
        {/* Software Categories Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {featuredPages.map((page) => {
            // Get the icon component or default to Zap
            const IconComponent = getIconComponent(page.icon);
            
            return (
              <motion.div key={page.id} variants={item}>
                <Link href={`/${page.slug}`}>
                  <Card className="group h-full p-6 cursor-pointer hover:shadow-md transition-all border border-gray-200 overflow-hidden relative">
                    {/* Background color fade on hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${page.bgColor || 'bg-blue-500'}`} />
                    
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${page.bgColor || 'bg-blue-50'}`}>
                      <IconComponent className={`w-6 h-6 ${page.iconColor || 'text-blue-600'}`} />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {page.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {page.description}
                    </p>
                    
                    {/* Arrow indicator on hover */}
                    <div className="flex items-center mt-auto text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore
                      <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}; 