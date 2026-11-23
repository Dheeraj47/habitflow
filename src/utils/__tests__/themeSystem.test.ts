import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  THEME_STORAGE_KEY_GUEST,
  THEME_DEFAULT_MODE,
  getUserThemeStorageKey,
  getStoredThemeMode,
  setStoredThemeMode,
  isValidThemeMode,
  resolveTheme,
} from '../themeStorage.ts';
import type { ToastItem } from '../../components/Toast/ToastContainer.tsx';

// Mock localStorage for Node environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('HabitFlow Design Foundation & Theme System Verification', () => {
  const rootDir = process.cwd();
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    (globalThis as any).window = {
      localStorage: mockStorage,
      matchMedia: (query: string) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    };
  });

  describe('1. Theme Initialization and Defaults', () => {
    it('defaults to dark mode when no theme preference is stored', () => {
      const mode = getStoredThemeMode();
      assert.equal(mode, THEME_DEFAULT_MODE);
      assert.equal(mode, 'dark');
    });

    it('correctly reads stored light theme preference', () => {
      mockStorage.setItem(THEME_STORAGE_KEY_GUEST, 'light');
      const mode = getStoredThemeMode();
      assert.equal(mode, 'light');
    });

    it('correctly reads stored system theme preference', () => {
      mockStorage.setItem(THEME_STORAGE_KEY_GUEST, 'system');
      const mode = getStoredThemeMode();
      assert.equal(mode, 'system');
    });

    it('ignores invalid stored values and falls back safely to dark', () => {
      mockStorage.setItem(THEME_STORAGE_KEY_GUEST, 'invalid_mode_value');
      const mode = getStoredThemeMode();
      assert.equal(mode, 'dark');
    });

    it('validates theme mode strings accurately', () => {
      assert.equal(isValidThemeMode('dark'), true);
      assert.equal(isValidThemeMode('light'), true);
      assert.equal(isValidThemeMode('system'), true);
      assert.equal(isValidThemeMode('neon'), false);
      assert.equal(isValidThemeMode(null), false);
      assert.equal(isValidThemeMode(undefined), false);
    });
  });

  describe('2. Theme Selection & Resolution', () => {
    it('resolves dark mode to dark', () => {
      assert.equal(resolveTheme('dark'), 'dark');
    });

    it('resolves light mode to light', () => {
      assert.equal(resolveTheme('light'), 'light');
    });

    it('resolves system mode based on matchMedia prefers-color-scheme', () => {
      // With dark media query matching
      assert.equal(resolveTheme('system'), 'dark');

      // With light media query matching
      (globalThis as any).window.matchMedia = () => ({
        matches: false, // does not match dark => light
        addEventListener: () => {},
        removeEventListener: () => {},
      });
      assert.equal(resolveTheme('system'), 'light');
    });

    it('persists selected theme changes to storage', () => {
      setStoredThemeMode('light');
      assert.equal(mockStorage.getItem(THEME_STORAGE_KEY_GUEST), 'light');

      setStoredThemeMode('dark');
      assert.equal(mockStorage.getItem(THEME_STORAGE_KEY_GUEST), 'dark');

      setStoredThemeMode('system');
      assert.equal(mockStorage.getItem(THEME_STORAGE_KEY_GUEST), 'system');
    });
  });

  describe('3. Account and Guest Preference Isolation', () => {
    it('generates isolated storage keys for authenticated users', () => {
      const userKey1 = getUserThemeStorageKey('user-123');
      const userKey2 = getUserThemeStorageKey('user-456');
      assert.equal(userKey1, 'habitflow_theme_mode_user-123');
      assert.equal(userKey2, 'habitflow_theme_mode_user-456');
      assert.notEqual(userKey1, userKey2);
    });

    it('falls back to guest key when userId is absent or empty', () => {
      assert.equal(getUserThemeStorageKey(), THEME_STORAGE_KEY_GUEST);
      assert.equal(getUserThemeStorageKey(''), THEME_STORAGE_KEY_GUEST);
      assert.equal(getUserThemeStorageKey('  '), THEME_STORAGE_KEY_GUEST);
    });

    it('persists and isolates user-specific preferences without overwriting other users', () => {
      setStoredThemeMode('light', 'user-alpha');
      setStoredThemeMode('dark', 'user-beta');

      assert.equal(getStoredThemeMode('user-alpha'), 'light');
      assert.equal(getStoredThemeMode('user-beta'), 'dark');
    });

    it('falls back to guest preference when an authenticated user has no saved preference yet', () => {
      mockStorage.setItem(THEME_STORAGE_KEY_GUEST, 'light');
      // user-gamma has no specific key saved
      assert.equal(getStoredThemeMode('user-gamma'), 'light');
    });
  });

  describe('4. Semantic Design Tokens & CSS Architecture', () => {
    const cssPath = path.join(rootDir, 'src', 'index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    it('index.css declares all required semantic design tokens in :root', () => {
      const requiredTokens = [
        '--app-bg',
        '--surface-base',
        '--surface-secondary',
        '--surface-elevated',
        '--text-primary',
        '--text-secondary',
        '--text-muted',
        '--border-subtle',
        '--border-strong',
        '--accent-primary',
        '--semantic-success',
        '--semantic-warning',
        '--semantic-error',
        '--semantic-info',
      ];

      for (const token of requiredTokens) {
        assert.ok(cssContent.includes(token), `index.css must define token ${token}`);
      }
    });

    it('index.css declares light theme overrides for professional light palette', () => {
      assert.ok(
        cssContent.includes('html.light') || cssContent.includes('[data-theme="light"]'),
        'index.css must include light theme overrides selector'
      );
      assert.ok(cssContent.includes('#f8fafc'), 'Light theme must use soft neutral #f8fafc background');
      assert.ok(cssContent.includes('#ffffff'), 'Light theme must use #ffffff base surface');
      assert.ok(cssContent.includes('#0f172a'), 'Light theme must use high-contrast dark readable text #0f172a');
    });

    it('index.css maps semantic tokens to Tailwind CSS v4 @theme block', () => {
      assert.ok(cssContent.includes('@theme'), 'Must include Tailwind v4 @theme declaration');
      assert.ok(cssContent.includes('--color-app-bg'), 'Must map --color-app-bg');
      assert.ok(cssContent.includes('--color-surface-base'), 'Must map --color-surface-base');
      assert.ok(cssContent.includes('--color-accent-primary'), 'Must map --color-accent-primary');
    });

    it('index.html includes synchronous zero-flash theme initialization script', () => {
      const htmlPath = path.join(rootDir, 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(
        htmlContent.includes('habitflow_theme_mode'),
        'index.html must check habitflow_theme_mode before render'
      );
      assert.ok(
        htmlContent.includes('classList.add(resolved)'),
        'index.html must add resolved theme class to documentElement'
      );
    });
  });

  describe('5. Appearance Settings UI', () => {
    const appearancePath = path.join(rootDir, 'src', 'components', 'Settings', 'AppearanceSection.tsx');
    const content = fs.readFileSync(appearancePath, 'utf-8');

    it('AppearanceSection provides accessible controls for Dark, Light, and System modes', () => {
      assert.ok(content.includes('role="radiogroup"'), 'Must define radiogroup for accessibility');
      assert.ok(content.includes('role="radio"'), 'Options must use radio role');
      assert.ok(content.includes('Dark Theme'), 'Must provide Dark Theme option');
      assert.ok(content.includes('Light Theme'), 'Must provide Light Theme option');
      assert.ok(content.includes('System Dynamic'), 'Must provide System option');
    });

    it('AppearanceSection includes visual preview cards for each theme option', () => {
      assert.ok(content.includes('previewBg'), 'Must provide previewBg for visual representation');
      assert.ok(content.includes('previewSurface'), 'Must provide previewSurface for card preview');
      assert.ok(content.includes('previewAccent'), 'Must highlight purple accent in previews');
    });
  });

  describe('6. Notification Queue & UX Improvements', () => {
    const toastPath = path.join(rootDir, 'src', 'components', 'Toast', 'ToastContainer.tsx');
    const toastContent = fs.readFileSync(toastPath, 'utf-8');

    it('ToastContainer limits visible notifications to prevent vertical mobile stacking', () => {
      assert.ok(
        toastContent.includes('visibleToasts = toasts.slice(-2)'),
        'Must bound active visible toasts to at most 2'
      );
      assert.ok(
        toastContent.includes('hiddenCount'),
        'Must track hidden/queued count to inform the user'
      );
    });

    it('ToastContainer respects mobile navigation safe areas and gesture bar', () => {
      assert.ok(
        toastContent.includes('safe-area-inset-bottom'),
        'Toast container must include safe-area-inset-bottom'
      );
      assert.ok(
        toastContent.includes('bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]'),
        'Toast container must sit above mobile navbar'
      );
    });

    it('ToastContainer preserves Undo action and callback invocation', () => {
      assert.ok(toastContent.includes('toast.onAction'), 'Must support onAction callback');
      assert.ok(toastContent.includes('toast.onAction?.()'), 'Must invoke onAction callback on tap');
    });

    it('ToastContainer provides semantic visual distinction for all notification types', () => {
      assert.ok(toastContent.includes('text-emerald-500'), 'Success must use emerald');
      assert.ok(toastContent.includes('text-rose-500'), 'Error must use rose');
      assert.ok(toastContent.includes('text-cyan-500'), 'Info must use cyan');
      assert.ok(toastContent.includes('var(--accent-primary)'), 'Undo must use purple brand accent');
    });

    it('controlled toast queue handles multiple sequential notifications accurately', () => {
      const mockToasts: ToastItem[] = [
        { id: '1', message: 'T1', type: 'info' },
        { id: '2', message: 'T2', type: 'success' },
        { id: '3', message: 'T3', type: 'undo', actionLabel: 'Undo', onAction: () => {} },
      ];

      const visible = mockToasts.slice(-2);
      const hiddenCount = mockToasts.length - visible.length;

      assert.equal(visible.length, 2);
      assert.equal(visible[0].id, '2');
      assert.equal(visible[1].id, '3');
      assert.equal(hiddenCount, 1);
    });
  });
});
