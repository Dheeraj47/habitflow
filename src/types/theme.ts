/**
 * Theme Modes and Token Types for HabitFlow Design System
 */

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

export interface ThemeOption {
  id: ThemeMode;
  title: string;
  subtitle: string;
  description: string;
}
