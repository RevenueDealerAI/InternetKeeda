import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };
  
  return (
    <button
      onClick={toggleTheme}
      className={`rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'light' && (
        <SunIcon className="h-5 w-5 text-amber-500" />
      )}
      {theme === 'dark' && (
        <MoonIcon className="h-5 w-5 text-indigo-400" />
      )}
      {theme === 'system' && (
        <ComputerDesktopIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  );
};

interface ThemeToggleMenuProps {
  className?: string;
}

export const ThemeToggleMenu: React.FC<ThemeToggleMenuProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className={`flex flex-col space-y-2 rounded-md border border-gray-200 p-2 dark:border-gray-700 ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm ${
          theme === 'light' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <SunIcon className="h-4 w-4 text-amber-500" />
        <span>Light</span>
        {theme === 'light' && (
          <span className="ml-auto text-xs text-green-500">✓</span>
        )}
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm ${
          theme === 'dark' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <MoonIcon className="h-4 w-4 text-indigo-400" />
        <span>Dark</span>
        {theme === 'dark' && (
          <span className="ml-auto text-xs text-green-500">✓</span>
        )}
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm ${
          theme === 'system' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <ComputerDesktopIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span>System</span>
        {theme === 'system' && (
          <span className="ml-auto text-xs text-green-500">✓</span>
        )}
      </button>
    </div>
  );
}; 