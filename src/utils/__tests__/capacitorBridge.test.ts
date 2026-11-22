import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isNative,
  parseAuthUrl,
  registerBackButtonHandler,
  executeBackButton,
} from '../capacitorBridge.ts';

describe('Capacitor Bridge & Android Native Integration', () => {
  it('isNative returns false in standard node/browser environment', () => {
    assert.strictEqual(isNative(), false);
  });

  describe('parseAuthUrl', () => {
    it('extracts tokens from hash fragment (OAuth callback style)', () => {
      const url = 'com.habitflow.app://auth/callback#access_token=eyJhbGciOiJIUzI1NiJ9&refresh_token=refr123&type=bearer';
      const result = parseAuthUrl(url);
      assert.ok(result);
      assert.strictEqual(result.accessToken, 'eyJhbGciOiJIUzI1NiJ9');
      assert.strictEqual(result.refreshToken, 'refr123');
      assert.strictEqual(result.type, 'bearer');
    });

    it('extracts tokens from query params (standard callback style)', () => {
      const url = 'https://localhost/auth/callback?access_token=abc12345&refresh_token=xyz987';
      const result = parseAuthUrl(url);
      assert.ok(result);
      assert.strictEqual(result.accessToken, 'abc12345');
      assert.strictEqual(result.refreshToken, 'xyz987');
    });

    it('returns null when URL has no auth tokens', () => {
      const url = 'com.habitflow.app://dashboard';
      assert.strictEqual(parseAuthUrl(url), null);
    });

    it('handles malformed URLs safely without throwing', () => {
      assert.strictEqual(parseAuthUrl('not-a-valid-url'), null);
      assert.strictEqual(parseAuthUrl(''), null);
    });
  });

  describe('Hardware Back Button Stack & Handlers', () => {
    it('executes handlers in LIFO (last registered first) order', () => {
      const callLog: string[] = [];

      const unregisterBottom = registerBackButtonHandler(() => {
        callLog.push('bottom');
        return true;
      });

      const unregisterTop = registerBackButtonHandler(() => {
        callLog.push('top');
        return true;
      });

      const handled = executeBackButton();
      assert.strictEqual(handled, true);
      assert.deepStrictEqual(callLog, ['top']);

      unregisterTop();
      unregisterBottom();
    });

    it('cascades to earlier handler when top handler returns false', () => {
      const callLog: string[] = [];

      const unregisterBottom = registerBackButtonHandler(() => {
        callLog.push('bottom');
        return true;
      });

      const unregisterTop = registerBackButtonHandler(() => {
        callLog.push('top-pass');
        return false; // did not consume event
      });

      const handled = executeBackButton();
      assert.strictEqual(handled, true);
      assert.deepStrictEqual(callLog, ['top-pass', 'bottom']);

      unregisterTop();
      unregisterBottom();
    });

    it('returns false when no handler consumes the back press', () => {
      const unregister = registerBackButtonHandler(() => false);
      const handled = executeBackButton();
      assert.strictEqual(handled, false);
      unregister();
    });

    it('unregister function safely removes handler from stack', () => {
      const callLog: string[] = [];

      const unregister = registerBackButtonHandler(() => {
        callLog.push('invoked');
        return true;
      });

      unregister(); // Remove immediately

      const handled = executeBackButton();
      assert.strictEqual(handled, false);
      assert.deepStrictEqual(callLog, []);
    });
  });
});
