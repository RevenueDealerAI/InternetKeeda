/**
 * Theme Configuration
 * This file manages theme routing and theme-specific configurations
 */

export interface ThemeConfig {
  id: string;
  name: string;
  path: string;
  description: string;
  isActive: boolean;
  isAvailable: boolean; // Whether this theme is available for admin to select
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'theme-one',
    name: 'Theme One',
    path: '/', // Default theme uses root path
    description: 'Current modern design with clean UI',
    isActive: true, // This will be overridden by admin settings
    isAvailable: true
  },
  {
    id: 'theme-two',
    name: 'Theme Two',
    path: '/theme-two',
    description: 'Future theme with different design approach',
    isActive: false, // This will be overridden by admin settings
    isAvailable: true
  }
];

export const DEFAULT_THEME = 'theme-two';

export const getActiveTheme = (): ThemeConfig => {
  return THEMES.find(theme => theme.isActive) || THEMES[0];
};

export const getActiveThemeById = (activeThemeId?: string): ThemeConfig => {
  if (!activeThemeId) {
    return THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  }
  return THEMES.find(t => t.id === activeThemeId) || THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
};

export const getThemeByPath = (path: string): ThemeConfig | undefined => {
  return THEMES.find(theme => path.startsWith(theme.path));
};

export const getThemePath = (themeId: string, path: string = ''): string => {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return path;
  
  // Remove any existing theme prefix
  const cleanPath = path.replace(/^\/theme-(one|two)/, '');
  return `${theme.path}${cleanPath}`;
};
