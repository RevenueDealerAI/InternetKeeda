'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Mode = 'light' | 'dark';

function readMode(): Mode {
  if (typeof document === 'undefined') return 'dark';
  const a = document.documentElement.dataset.theme;
  return a === 'light' ? 'light' : 'dark';
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(readMode());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    const root = document.documentElement;
    root.dataset.theme = next;
    // Keep the .dark class in sync so Tailwind dark: utilities
    // flip with the toggle (the CSS-variable palette is driven by
    // data-theme; Tailwind uses the class).
    root.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('ik-theme', next);
    } catch {
      /* localStorage unavailable */
    }
  };

  if (!mounted) return null;

  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="grid h-9 w-9 place-items-center rounded-full transition-all duration-200"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--rule)',
        color: 'var(--ink-2)',
      }}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
