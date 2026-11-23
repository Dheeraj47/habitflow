import type { ThemeMode, ResolvedTheme } from '../types/theme.ts';

export const THEME_STORAGE_KEY_GUEST = 'habitflow_theme_mode';
export const THEME_DEFAULT_MODE: ThemeMode = 'dark';

export function getUserThemeStorageKey(userId?: string): string {
  if (userId && userId.trim()) {
    return `habitflow_theme_mode_${userId.trim()}`;
  }
  return THEME_STORAGE_KEY_GUEST;
}

/**
 * Read the stored theme mode, prioritizing authenticated user key before falling back to guest key.
 * Defaults to 'dark' for backward compatibility.
 */
export function getStoredThemeMode(userId?: string): ThemeMode {
  if (typeof window === 'undefined' || !window.localStorage) {
    return THEME_DEFAULT_MODE;
  }

  try {
    // 1. Check user-scoped preference if authenticated
    if (userId) {
      const userKey = getUserThemeStorageKey(userId);
      const userValue = window.localStorage.getItem(userKey);
      if (isValidThemeMode(userValue)) {
        return userValue;
      }
    }

    // 2. Fallback to guest preference
    const guestValue = window.localStorage.getItem(THEME_STORAGE_KEY_GUEST);
    if (isValidThemeMode(guestValue)) {
      return guestValue;
    }
  } catch (err) {
    console.warn('[HabitFlow Theme] Failed to read from localStorage:', err);
  }

  return THEME_DEFAULT_MODE;
}

/**
 * Persist the theme mode in localStorage.
 * When authenticated, persists to both user-scoped key and guest key to avoid jarring transitions.
 */
export function setStoredThemeMode(mode: ThemeMode, userId?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    if (userId) {
      const userKey = getUserThemeStorageKey(userId);
      window.localStorage.setItem(userKey, mode);
    }
    window.localStorage.setItem(THEME_STORAGE_KEY_GUEST, mode);
  } catch (err) {
    console.warn('[HabitFlow Theme] Failed to write to localStorage:', err);
  }
}

/**
 * Check if a string is a valid ThemeMode ('dark' | 'light' | 'system')
 */
export function isValidThemeMode(val: unknown): val is ThemeMode {
  return val === 'dark' || val === 'light' || val === 'system';
}

/**
 * Resolve the current system appearance from the browser/OS prefers-color-scheme media query.
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve a ThemeMode ('dark' | 'light' | 'system') to an active 'dark' or 'light' string.
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Apply the resolved theme to the DOM, updating root class, data-theme attribute,
 * CSS color-scheme, and the mobile browser theme-color meta tag.
 */
export function applyThemeToDocument(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  if (resolved === 'dark') {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  // Update mobile status bar theme-color meta tag
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0b0d14' : '#f8fafc');
  }
}
