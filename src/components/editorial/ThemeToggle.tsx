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
  // The init script in layout.tsx sets data-theme before hydration —
  // we only mirror that here so the icon matches the current state.
  const [mode, setMode] = useState<Mode>(() => readMode());

  useEffect(() => {
    // If something else changed data-theme between SSR + hydrate,
    // pick up the new value.
    setMode(readMode());
  }, []);

  const toggle = () => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('ik-theme', next);
    } catch {
      // localStorage unavailable (private mode etc.) — non-fatal
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="ik-pill fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5"
    >
      {mode === 'dark' ? (
        <Sun className="h-4 w-4 text-foreground" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-foreground" aria-hidden="true" />
      )}
    </button>
  );
}
