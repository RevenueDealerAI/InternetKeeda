import React, { useState } from 'react';
import { useRouter } from 'next/navigation'
import { usePathname, useSearchParams } from 'next/navigation'
import { THEMES, getThemeByPath } from './theme-config';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Palette, Check } from 'lucide-react';

interface ThemeSwitcherProps {
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname: pathname || '/', search: searchParams ? `?${searchParams.toString()}` : '', hash: '', state: null };
  const [isOpen, setIsOpen] = useState(false);
  
  const currentTheme = getThemeByPath(location.pathname) || THEMES[0];
  
  const handleThemeChange = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;
    
    // Get current path without theme prefix
    const currentPath = location.pathname.replace(/^\/theme-(one|two)/, '');
    
    // Navigate to new theme with same path
    const newPath = `${theme.path}${currentPath}`;
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${className}`}
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">{currentTheme.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{theme.name}</span>
              <span className="text-xs text-gray-500">{theme.description}</span>
            </div>
            {currentTheme.id === theme.id && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
