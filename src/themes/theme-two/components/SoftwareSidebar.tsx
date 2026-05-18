import { useState } from 'react';
import Link from 'next/link'
import { 
  Target, 
  FileText, 
  Sparkle, 
  Users, 
  Briefcase, 
  Mail, 
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SoftwareCategoryItem {
  title: string;
  slug: string;
  icon: React.ReactNode;
}

export const SoftwareSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const categories: SoftwareCategoryItem[] = [
    {
      title: 'Project Management Tools',
      slug: '/best-project-management-tools',
      icon: <Target className="h-4 w-4 text-gray-500" />
    },
    {
      title: 'AI Note-Taking Software',
      slug: '/best-ai-note-taking-software',
      icon: <FileText className="h-4 w-4 text-gray-500" />
    },
    {
      title: 'AI Daily Planning Software',
      slug: '/best-ai-daily-planning-software',
      icon: <Sparkle className="h-4 w-4 text-gray-500" />
    },
    {
      title: 'AI Meeting Tools',
      slug: '/best-ai-meeting-tools',
      icon: <Users className="h-4 w-4 text-gray-500" />
    },
    {
      title: 'CRM Software for Teams',
      slug: '/best-crm-software-for-teams',
      icon: <Briefcase className="h-4 w-4 text-gray-500" />
    },
    {
      title: 'AI Email Management Tools',
      slug: '/best-ai-email-management-tools',
      icon: <Mail className="h-4 w-4 text-gray-500" />
    },
    {
      title: 'Productivity Tools for ADHD',
      slug: '/best-productivity-tools-for-adhd',
      icon: <Zap className="h-4 w-4 text-gray-500" />
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar Header (Always Visible) */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="font-medium text-gray-900 text-sm">BEST SOFTWARE</h3>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        )}
      </div>

      {/* Collapsible Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
        <div className="px-2 pb-3">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.slug}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
            >
              {category.icon}
              <span>{category.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}; 