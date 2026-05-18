import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, DEFAULT_THEME, ThemeConfig, getActiveThemeById } from './theme-config';
import { useSiteConfig } from '@/contexts/SiteConfigContext';

interface ThemeContextType {
  currentTheme: ThemeConfig;
  setTheme: (themeId: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const defaultTheme = THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const { config, loading: configLoading } = useSiteConfig();

  useEffect(() => {
    if (configLoading) {
      setIsLoading(true);
      return;
    }

    if (config?.activeTheme) {
      const theme = getActiveThemeById(config.activeTheme);
      if (theme && theme.id !== currentTheme.id) {
        setCurrentTheme(theme);
      }
    } else if (config && !config.activeTheme && currentTheme.id !== defaultTheme.id) {
      setCurrentTheme(defaultTheme);
    }

    setIsLoading(false);
  }, [config?.activeTheme, configLoading, currentTheme.id, defaultTheme, config, defaultTheme.id]);

  const setTheme = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      // Note: Theme changes should be saved through admin settings
      // This function is mainly for internal state management
    }
  };

  // Optional: add debug logs behind a flag if needed

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, isLoading }}>
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
