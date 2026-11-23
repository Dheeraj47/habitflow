import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ThemeMode, ResolvedTheme, ThemeContextValue } from '../types/theme';
import {
  getStoredThemeMode,
  setStoredThemeMode,
  getSystemTheme,
  applyThemeToDocument,
} from '../utils/themeStorage';
import { updateNativeStatusBar } from '../utils/capacitorBridge';
import { useAuth } from './AuthContext';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { authUser } = useAuth();
  const userId = authUser?.id;

  const [mode, setModeState] = useState<ThemeMode>(() => getStoredThemeMode(userId));
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  // Derive active resolved theme
  const resolvedTheme: ResolvedTheme = mode === 'system' ? systemTheme : mode;

  // Track system OS preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Synchronize document attributes and native status bar whenever resolvedTheme changes
  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
    updateNativeStatusBar(resolvedTheme);
  }, [resolvedTheme]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    setStoredThemeMode(newMode, userId);
  }, [userId]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
