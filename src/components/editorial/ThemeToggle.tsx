'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Mode = 'light' | 'dark';

function readMode(): Mode {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.dataset.theme;
  if (attr === 'dark' || attr === 'light') return attr;
  return 'light';
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>(() => readMode());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(readMode());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('ik-theme', next);
    } catch {
      // localStorage unavailable — non-fatal
    }
  };

  // Avoid hydration mismatch — render after mount so the icon reflects
  // whatever the init script set.
  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="bg-gradient-blood shadow-blood fixed right-3 top-3 z-[90] flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform hover:-translate-y-0.5 sm:right-5 sm:top-5"
      style={{ borderRadius: '9999px' }}
    >
      {mode === 'dark' ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
