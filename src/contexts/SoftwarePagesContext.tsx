import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SoftwarePage {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  content?: {
    introduction?: string;
    toolsHeading?: string;
    toolsDescription?: string;
    author?: string;
    authorImage?: string;
    lastUpdated?: string;
  };
}

interface SoftwarePagesContextType {
  pages: SoftwarePage[];
  isLoading: boolean;
  error: string | null;
  refreshPages: () => void;
  addPage: (page: Partial<SoftwarePage>) => void;
  updatePage: (id: string, page: Partial<SoftwarePage>) => void;
  deletePage: (id: string) => void;
}

const SoftwarePagesContext = createContext<SoftwarePagesContextType>({
  pages: [],
  isLoading: false,
  error: null,
  refreshPages: () => {},
  addPage: () => {},
  updatePage: () => {},
  deletePage: () => {},
});

export const useSoftwarePages = () => useContext(SoftwarePagesContext);

// Storage key
const STORAGE_KEY = 'ai-hunt-software-pages';

// Initial sample data
const INITIAL_PAGES: SoftwarePage[] = [
  {
    id: '1',
    title: 'Best Project Management Tools',
    slug: 'best-project-management-tools',
    description: 'Discover the best tools for team collaboration',
    icon: 'BarChart3',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: {
      introduction: 'Project management tools with AI capabilities are revolutionizing how teams collaborate and organize their work. These tools help streamline workflows, automate repetitive tasks, and provide valuable insights.',
      toolsHeading: 'Top AI Project Management Tools',
      toolsDescription: 'We\'ve evaluated the leading AI-powered project management solutions to help you find the perfect tool for your team.',
      author: 'Michael Chen',
      authorImage: 'https://ui-avatars.com/api/?name=Michael+Chen&background=6466F1&color=fff',
      lastUpdated: 'May 2025'
    }
  },
  {
    id: '2',
    title: 'Best AI Note-Taking Software',
    slug: 'best-ai-note-taking-software',
    description: 'Optimize your note-taking and personal knowledge',
    icon: 'PenTool',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: {
      introduction: 'AI note-taking software revolutionizes how we capture and organize information, helping you focus on thinking and creating while the AI handles organization.',
      toolsHeading: 'Best AI Note-Taking Tools',
      toolsDescription: 'We\'ve evaluated the leading AI-powered note-taking solutions to help you find the perfect tool.',
      author: 'Emily Chen',
      authorImage: 'https://ui-avatars.com/api/?name=Emily+Chen&background=6466F1&color=fff',
      lastUpdated: 'May 2025'
    }
  },
  {
    id: '3',
    title: 'Best AI Meeting Tools',
    slug: 'best-ai-meeting-tools',
    description: 'Enhance your meetings and reduce preparation time',
    icon: 'Users',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Best AI Email Management Tools',
    slug: 'best-ai-email-management-tools',
    description: 'Get through your inbox with ease and organization',
    icon: 'Mail',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'Best AI Daily Planning Software',
    slug: 'best-ai-daily-planning-software',
    description: 'Choose your priorities, organize your day',
    icon: 'CalendarClock',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'Best CRM Software for Teams',
    slug: 'best-crm-software-for-teams',
    description: 'Capture your leads, nurture your contacts',
    icon: 'Briefcase',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    title: 'Best Productivity Tools for ADHD',
    slug: 'best-productivity-tools-for-adhd',
    description: 'Work better with your ADHD with productivity tools',
    icon: 'Target',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper function to get data from localStorage
const getStoredPages = (): SoftwarePage[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error retrieving software pages from localStorage:', error);
  }
  return INITIAL_PAGES;
};

// Helper function to store data in localStorage
const storePages = (pages: SoftwarePage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch (error) {
    console.error('Error storing software pages in localStorage:', error);
  }
};

export const SoftwarePagesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [pages, setPages] = useState<SoftwarePage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Update localStorage whenever pages change
  useEffect(() => {
    if (pages.length > 0) {
      storePages(pages);
    }
  }, [pages]);

  // CRUD operations
  const addPage = (page: Partial<SoftwarePage>) => {
    const newPage = {
      ...page,
      id: page.id || `page-${Date.now()}`,
      slug: page.slug || page.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as SoftwarePage;
    
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    storePages(updatedPages);
    
    console.log('Added new software page:', newPage);
  };

  const updatePage = (id: string, updatedPage: Partial<SoftwarePage>) => {
    const updatedPages = pages.map(page => 
      page.id === id 
        ? { 
            ...page, 
            ...updatedPage, 
            updatedAt: new Date().toISOString() 
          } 
        : page
    );
    
    setPages(updatedPages);
    storePages(updatedPages);
    
    console.log('Updated software page:', id, updatedPage);
  };

  const deletePage = (id: string) => {
    const updatedPages = pages.filter(page => page.id !== id);
    setPages(updatedPages);
    storePages(updatedPages);
    
    console.log('Deleted software page:', id);
  };

  const fetchPages = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load from localStorage or use initial data if not available
      const storedPages = getStoredPages();
      setPages(storedPages);
      
    } catch (err) {
      setError('Failed to fetch software pages');
      console.error('Error fetching software pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPages = () => {
    fetchPages();
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return (
    <SoftwarePagesContext.Provider 
      value={{ 
        pages, 
        isLoading, 
        error, 
        refreshPages,
        addPage,
        updatePage,
        deletePage
      }}
    >
      {children}
    </SoftwarePagesContext.Provider>
  );
}; 