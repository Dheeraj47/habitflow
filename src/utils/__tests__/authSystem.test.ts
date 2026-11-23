import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseAuthUrl } from '../capacitorBridge.ts';

describe('HabitFlow Authentication & OAuth Repair Verification', () => {
  describe('1. Deep Link & OAuth URL Parsing (PKCE + Implicit + Error flows)', () => {
    it('accurately parses PKCE authorization code from Android deep link query params', () => {
      const url = 'com.habitflow.app://auth/callback?code=pkce_secret_auth_code_991827';
      const parsed = parseAuthUrl(url);
      assert.ok(parsed);
      assert.strictEqual(parsed.code, 'pkce_secret_auth_code_991827');
      assert.strictEqual(parsed.error, undefined);
    });

    it('accurately parses implicit OAuth tokens from fragment (#access_token)', () => {
      const url = 'com.habitflow.app://auth/callback#access_token=jwt.token.here&refresh_token=refr_999&type=bearer';
      const parsed = parseAuthUrl(url);
      assert.ok(parsed);
      assert.strictEqual(parsed.accessToken, 'jwt.token.here');
      assert.strictEqual(parsed.refreshToken, 'refr_999');
      assert.strictEqual(parsed.type, 'bearer');
    });

    it('captures OAuth error and decodes human-readable error description', () => {
      const url = 'com.habitflow.app://auth/callback?error=access_denied&error_description=The+user+cancelled+the+Google+sign-in+process';
      const parsed = parseAuthUrl(url);
      assert.ok(parsed);
      assert.strictEqual(parsed.error, 'access_denied');
      assert.strictEqual(parsed.errorDescription, 'The user cancelled the Google sign-in process');
    });

    it('returns null on internal application URLs without auth credentials', () => {
      assert.strictEqual(parseAuthUrl('com.habitflow.app://workspace'), null);
      assert.strictEqual(parseAuthUrl('https://localhost:5173/dashboard'), null);
    });

    it('safely handles empty strings and malformed URLs without throwing exceptions', () => {
      assert.strictEqual(parseAuthUrl(''), null);
      assert.strictEqual(parseAuthUrl('random-broken-protocol:///?///'), null);
    });
  });

  describe('2. Android Manifest & Capacitor Deep Link Scheme Audit', () => {
    const manifestPath = path.resolve(process.cwd(), 'android/app/src/main/AndroidManifest.xml');
    const capConfigPath = path.resolve(process.cwd(), 'capacitor.config.ts');

    it('AndroidManifest.xml registers com.habitflow.app custom URL scheme with BROWSABLE category', () => {
      const content = fs.readFileSync(manifestPath, 'utf8');
      assert.ok(content.includes('android:scheme="com.habitflow.app"'), 'Must register com.habitflow.app custom scheme');
      assert.ok(content.includes('android.intent.category.BROWSABLE'), 'Must have BROWSABLE category for browser callbacks');
      assert.ok(content.includes('android.intent.action.VIEW'), 'Must have VIEW action');
    });

    it('capacitor.config.ts defines matching appId com.habitflow.app', () => {
      const content = fs.readFileSync(capConfigPath, 'utf8');
      assert.ok(content.includes("appId: 'com.habitflow.app'"));
    });
  });

  describe('3. AuthContext OAuth & Deep Link Integration Audit', () => {
    const authContextPath = path.resolve(process.cwd(), 'src/context/AuthContext.tsx');
    const content = fs.readFileSync(authContextPath, 'utf8');

    it('implements PKCE code exchange using supabase.auth.exchangeCodeForSession', () => {
      assert.ok(content.includes('supabase.auth.exchangeCodeForSession(parsed.code)'), 'PKCE exchange code must be implemented');
    });

    it('implements token restoration via supabase.auth.setSession', () => {
      assert.ok(content.includes('supabase.auth.setSession('), 'Session restoration must be implemented');
    });

    it('handles OAuth error states from deep link callbacks', () => {
      assert.ok(content.includes('parsed.error || parsed.errorDescription'), 'Error callback handling must be present');
    });

    it('prevents concurrent duplicate OAuth requests', () => {
      assert.ok(content.includes('if (isActionLoading)'), 'Must guard against concurrent authentication triggers');
    });

    it('uses com.habitflow.app://auth/callback on native platform and origin on web', () => {
      assert.ok(content.includes("'com.habitflow.app://auth/callback'"), 'Native redirect must point to custom scheme');
      assert.ok(content.includes('window.location.origin'), 'Web redirect must point to window.location.origin');
    });
  });

  describe('4. AuthModal Premium UI & Accessibility Audit', () => {
    const authModalPath = path.resolve(process.cwd(), 'src/components/Auth/AuthModal.tsx');
    const content = fs.readFileSync(authModalPath, 'utf8');

    it('uses semantic theme custom properties for surfaces, borders, and typography', () => {
      assert.ok(content.includes('var(--surface-base)'), 'Modal card must use semantic surface-base');
      assert.ok(content.includes('var(--surface-secondary)'), 'Inputs must use semantic surface-secondary');
      assert.ok(content.includes('var(--accent-primary)'), 'Primary actions must use semantic purple accent');
      assert.ok(content.includes('var(--text-primary)'), 'Headings must use semantic text-primary');
    });

    it('implements min-h-[44px] touch target on Google button and primary submit', () => {
      assert.ok(content.includes('min-h-[44px]'), 'Interactive buttons must respect 44px mobile touch standards');
    });

    it('supports password visibility toggling with accessible ARIA labels', () => {
      assert.ok(content.includes('aria-label={showPassword ?'), 'Must have dynamic ARIA label for password toggle');
      assert.ok(content.includes('type={showPassword ?'), 'Must toggle between text and password types');
    });

    it('registers hardware back-button handler for Android APK dismissal', () => {
      assert.ok(content.includes('registerBackButtonHandler'), 'Must register back button handler');
    });

    it('respects mobile safe areas on overlay container', () => {
      assert.ok(content.includes('safe-area-inset-top'), 'Must account for status bar safe area');
      assert.ok(content.includes('safe-area-inset-bottom'), 'Must account for gesture navigation safe area');
    });

    it('supports small-screen scrolling when on-screen keyboard appears', () => {
      assert.ok(content.includes('overflow-y-auto'), 'Modal body must scroll on small screens');
    });
  });
});
