import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      return savedTheme || 'system';
    }
    return 'system';
  });
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Function to set theme and save to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // Fetch site config to get default theme
  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const response = await axios.get(`/api/config`);
        if (response.data && response.data.defaultTheme) {
          // Only set from config if user hasn't explicitly set a preference
          if (!localStorage.getItem('theme')) {
            setThemeState(response.data.defaultTheme);
          }
        }
      } catch (error) {
        console.error('Failed to fetch site config:', error);
      }
    };
    
    fetchSiteConfig();
  }, []);
  
  // Effect to apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      // Determine if dark mode should be applied
      let shouldApplyDark = false;
      
      if (theme === 'dark') {
        shouldApplyDark = true;
      } else if (theme === 'system') {
        shouldApplyDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      // Apply or remove dark class on document element
      if (shouldApplyDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      setIsDarkMode(shouldApplyDark);
    };
    
    applyTheme();
    
    // Listen for system preference changes if in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 