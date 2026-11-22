import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export type BackButtonHandler = () => boolean;

// Stack of active back button handlers (modals, drawers, nested views)
const backButtonHandlers: BackButtonHandler[] = [];
let isBackButtonInitialized = false;

/**
 * Check if running inside native Android/iOS container
 */
export function isNative(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

/**
 * Register a back-button handler (e.g. for closing an active modal or drawer).
 * Handlers are evaluated in LIFO (last-in, first-out) order.
 * If handler returns true, the event is considered consumed.
 * Returns an unsubscribe cleanup function.
 */
export function registerBackButtonHandler(handler: BackButtonHandler): () => void {
  backButtonHandlers.push(handler);
  return () => {
    const idx = backButtonHandlers.lastIndexOf(handler);
    if (idx !== -1) {
      backButtonHandlers.splice(idx, 1);
    }
  };
}

/**
 * Execute back button action.
 * Returns true if handled by an active modal/subview handler,
 * false if unhandled (caller can navigate back or exit app).
 */
export function executeBackButton(): boolean {
  for (let i = backButtonHandlers.length - 1; i >= 0; i--) {
    const handler = backButtonHandlers[i];
    try {
      const handled = handler();
      if (handled) return true;
    } catch (e) {
      console.warn('[HabitFlow Native] Error in back button handler:', e);
    }
  }
  return false;
}

/**
 * Parse an auth redirect URL (custom scheme or https) for OAuth tokens
 */
export function parseAuthUrl(url: string): { accessToken?: string; refreshToken?: string; type?: string } | null {
  try {
    const urlObj = new URL(url);
    const hash = urlObj.hash.startsWith('#') ? urlObj.hash.substring(1) : urlObj.hash;
    const params = new URLSearchParams(hash || urlObj.search);
    const accessToken = params.get('access_token') || undefined;
    const refreshToken = params.get('refresh_token') || undefined;
    const type = params.get('type') || undefined;

    if (accessToken || refreshToken) {
      return { accessToken, refreshToken, type };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Initialize native device integrations when running inside Android APK
 */
export async function initNativeIntegrations(options?: {
  onDefaultBack?: () => void;
  onDeepLinkAuth?: (authData: { accessToken?: string; refreshToken?: string }) => void;
}): Promise<void> {
  if (!isNative()) return;

  try {
    // Configure dark status bar matching HabitFlow obsidian identity (#0b0d14)
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0b0d14' });
  } catch (err) {
    console.warn('[HabitFlow Native] StatusBar configuration warning:', err);
  }

  // Setup hardware back-button listener once
  if (!isBackButtonInitialized) {
    isBackButtonInitialized = true;
    try {
      await CapApp.addListener('backButton', () => {
        const consumed = executeBackButton();
        if (!consumed) {
          if (options?.onDefaultBack) {
            options.onDefaultBack();
          } else {
            CapApp.exitApp();
          }
        }
      });
    } catch (err) {
      console.warn('[HabitFlow Native] Back button listener warning:', err);
    }
  }

  // Setup deep linking / OAuth custom scheme handler
  try {
    await CapApp.addListener('appUrlOpen', (event) => {
      if (!event.url) return;
      const parsed = parseAuthUrl(event.url);
      if (parsed && options?.onDeepLinkAuth) {
        options.onDeepLinkAuth(parsed);
      }
    });
  } catch (err) {
    console.warn('[HabitFlow Native] Deep link listener warning:', err);
  }
}
