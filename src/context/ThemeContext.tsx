// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'ally-theme';

export const PROTECTED_ROUTES = [
  '/dashboard',
  '/discover',
  '/messages',
  '/requests',
  '/profile',
  '/notifications',
  '/blocked-users',
  '/settings',
  '/pending-approval',
];

export function isProtectedRoute(pathname: string): boolean {
  if (!pathname) return false;
  return PROTECTED_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      return saved;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return 'system';
}

function useSafeLocation() {
  try {
    return useLocation();
  } catch (e) {
    return { pathname: typeof window !== 'undefined' ? window.location.pathname : '/' };
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useSafeLocation();
  const currentPath = location.pathname;
  const isProtected = isProtectedRoute(currentPath);

  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;
  const isTransitioningRef = useRef(false);

  // Synchronize system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Directly apply dark class to <html>
  const applyDarkClass = useCallback((targetResolved: ResolvedTheme) => {
    const root = document.documentElement;
    if (targetResolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  // Execute the fast lower-right curve-inward sweep animation
  const executeThemeTransition = useCallback((targetTheme: Theme, targetResolved: ResolvedTheme) => {
    if (isTransitioningRef.current) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check if View Transitions API is supported
    const hasViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document;

    if (hasViewTransition && !prefersReducedMotion) {
      isTransitioningRef.current = true;
      document.documentElement.classList.add('theme-transitioning');

      // Native View Transition with custom CSS clip-path animation
      const transition = (document as any).startViewTransition(() => {
        setThemeState(targetTheme);
        if (isProtected) {
          applyDarkClass(targetResolved);
        } else {
          applyDarkClass('light');
        }
      });

      transition.finished
        .catch(() => {})
        .finally(() => {
          document.documentElement.classList.remove('theme-transitioning');
          isTransitioningRef.current = false;
        });
    } else if (!prefersReducedMotion) {
      // Fallback for browsers without View Transitions (e.g. Firefox)
      isTransitioningRef.current = true;
      const overlay = document.createElement('div');
      overlay.className = `theme-fallback-sweep ${targetResolved === 'dark' ? 'dark-sweep' : 'light-sweep'}`;
      document.body.appendChild(overlay);

      // Apply theme mid-sweep so the underlying page is ready
      setTimeout(() => {
        setThemeState(targetTheme);
        if (isProtected) {
          applyDarkClass(targetResolved);
        } else {
          applyDarkClass('light');
        }
      }, 160);

      // Clean up overlay when animation completes
      setTimeout(() => {
        overlay.remove();
        isTransitioningRef.current = false;
      }, 400);
    } else {
      // Instant switch for reduced-motion
      setThemeState(targetTheme);
      if (isProtected) {
        applyDarkClass(targetResolved);
      } else {
        applyDarkClass('light');
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, targetTheme);
    } catch (e) {
      // Ignore storage errors
    }
  }, [applyDarkClass, isProtected]);

  const setTheme = useCallback((newTheme: Theme) => {
    const targetResolved: ResolvedTheme = newTheme === 'system' ? getSystemTheme() : newTheme;

    if (newTheme === theme && targetResolved === resolvedTheme) {
      return;
    }

    if (targetResolved === resolvedTheme) {
      // Just updating the setting preference without visual theme toggle
      setThemeState(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (e) {}
      return;
    }

    executeThemeTransition(newTheme, targetResolved);
  }, [theme, resolvedTheme, executeThemeTransition]);

  const toggleTheme = useCallback(() => {
    const nextResolved: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    executeThemeTransition(nextResolved, nextResolved);
  }, [resolvedTheme, executeThemeTransition]);

  // Route-aware synchronization: only apply dark mode on protected routes
  useEffect(() => {
    if (isProtected) {
      applyDarkClass(resolvedTheme);
    } else {
      applyDarkClass('light');
    }
  }, [isProtected, resolvedTheme, applyDarkClass]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
