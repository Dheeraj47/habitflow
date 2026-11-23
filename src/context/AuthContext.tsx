import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { parseAuthUrl } from '../utils/capacitorBridge';

export interface AuthUser {
  id: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  provider: 'google' | 'email' | 'guest';
  isConfirmed: boolean;
}

export type AuthModalMode = 'signin' | 'signup' | 'confirmation_sent' | 'forgot_password';

export interface AuthContextType {
  // Session & User state
  user: User | null;
  session: Session | null;
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  isActionLoading: boolean;
  isConfigured: boolean;
  error: string | null;

  // Modal UI state
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  pendingConfirmationEmail: string | null;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  continueAsGuest: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;

  // Actions
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ success: boolean; needsConfirmation?: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  clearPendingConfirmation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  const email = user.email || '';
  
  // Resolve display name prioritizing metadata -> full name -> email username -> fallback
  const fullName = 
    metadata.full_name || 
    metadata.name || 
    (email ? email.split('@')[0] : 'HabitFlow User');

  const avatarUrl = metadata.avatar_url || metadata.picture || undefined;
  
  // Resolve auth provider
  const rawProvider = (user.app_metadata?.provider as string) || 'email';
  const provider = rawProvider === 'google' ? 'google' : 'email';

  // Check email confirmation status safely
  const isConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at);

  return {
    id: user.id,
    email,
    fullName,
    avatarUrl,
    provider,
    isConfirmed,
  };
}

function getInitialOAuthError(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : '';
    const search = window.location.search.startsWith('?')
      ? window.location.search.substring(1)
      : '';

    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(search);

    const oauthError = searchParams.get('error') || hashParams.get('error');
    const oauthDesc = searchParams.get('error_description') || hashParams.get('error_description');

    if (oauthError || oauthDesc) {
      return (
        decodeURIComponent((oauthDesc || oauthError || '').replace(/\+/g, ' ')) ||
        'Authentication failed. Please try again.'
      );
    }
  } catch {
    // Ignore error in initial parse
  }
  return null;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(supabase && isSupabaseConfigured));
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(() => getInitialOAuthError());

  // Modal and Guest interaction state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearPendingConfirmation = useCallback(() => setPendingConfirmationEmail(null), []);

  const openAuthModal = useCallback((mode: 'signin' | 'signup' = 'signin') => {
    setError(null);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setError(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsAuthModalOpen(false);
    setError(null);
  }, []);

  // Initialize session and subscribe to auth state changes
  useEffect(() => {
    // If Supabase is not configured, fall back to guest-only mode without blocking app
    if (!supabase || !isSupabaseConfigured) {
      return;
    }

    // Inspect URL for any OAuth error params or redirects to clean up
    try {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : '';
      const search = window.location.search.startsWith('?')
        ? window.location.search.substring(1)
        : '';

      const hashParams = new URLSearchParams(hash);
      const searchParams = new URLSearchParams(search);

      const oauthError = searchParams.get('error') || hashParams.get('error');
      const oauthDesc = searchParams.get('error_description') || hashParams.get('error_description');

      if (oauthError || oauthDesc) {
        // Clean error params from URL while keeping pathname
        window.history.replaceState(null, '', window.location.pathname);
      } else if (hashParams.get('access_token') || searchParams.get('code')) {
        // Successful OAuth or email confirmation redirect
        // Clean hash after small delay to let Supabase process tokens
        setTimeout(() => {
          if (window.location.hash || window.location.search.includes('code=')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 1500);
      }
    } catch (e) {
      console.warn('[HabitFlow Auth] Failed to parse URL auth parameters:', e);
    }

    // 1. Initial Session Restoration
    let isMounted = true;
    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted) return;
        if (sessionError) {
          console.warn('[HabitFlow Auth] getSession warning:', sessionError.message);
          setError(sessionError.message);
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[HabitFlow Auth] Unexpected error restoring session:', err);
        setIsLoading(false);
      });

    // 2. onAuthStateChange Subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, currentSession: Session | null) => {
      if (!isMounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);

      if (event === 'SIGNED_IN') {
        setError(null);
        setIsAuthModalOpen(false);
        setPendingConfirmationEmail(null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else if (event === 'USER_UPDATED') {
        setUser(currentSession?.user ?? null);
      }
    });

    // 3. Setup Capacitor deep link listener for OAuth callback inside Android WebView
    let urlListenerSub: { remove: () => void } | null = null;
    let appStateSub: { remove: () => void } | null = null;

    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      CapApp.addListener('appUrlOpen', async (event) => {
        if (!event.url) return;
        try {
          const parsed = parseAuthUrl(event.url);
          if (!parsed) return;

          if (parsed.error || parsed.errorDescription) {
            setError(parsed.errorDescription || parsed.error || 'Authentication failed or was cancelled.');
            setIsActionLoading(false);
            return;
          }

          if (parsed.code && supabase) {
            setIsActionLoading(true);
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code);
            if (exchangeError) {
              console.warn('[HabitFlow Auth] PKCE exchange error:', exchangeError.message);
              setError(exchangeError.message);
            } else if (data.session) {
              setSession(data.session);
              setUser(data.user);
              setIsAuthModalOpen(false);
              setError(null);
            }
            setIsActionLoading(false);
            return;
          }

          if (parsed.accessToken && supabase) {
            setIsActionLoading(true);
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: parsed.accessToken,
              refresh_token: parsed.refreshToken || '',
            });
            if (setSessionError) {
              console.warn('[HabitFlow Auth] Set session error:', setSessionError.message);
              setError(setSessionError.message);
            } else if (data.session) {
              setSession(data.session);
              setUser(data.user);
              setIsAuthModalOpen(false);
              setError(null);
            }
            setIsActionLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[HabitFlow Auth] Deep link auth handling warning:', err);
          setIsActionLoading(false);
        }
      }).then((sub) => {
        urlListenerSub = sub;
      }).catch((e) => {
        console.warn('[HabitFlow Auth] Failed to register appUrlOpen listener:', e);
      });

      // Clear any stuck action loading when returning to app
      CapApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          setTimeout(() => {
            setIsActionLoading(false);
          }, 2000);
        }
      }).then((sub) => {
        appStateSub = sub;
      }).catch(() => {});
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (urlListenerSub) {
        urlListenerSub.remove();
      }
      if (appStateSub) {
        appStateSub.remove();
      }
    };
  }, []);

  // Email and Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured' };
    }

    setIsActionLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return { success: false, error: signInError.message };
      }

      setSession(data.session);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsActionLoading(false);
    }
  };

  // Email and Password Sign Up (with confirmation check)
  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured' };
    }

    setIsActionLoading(true);
    setError(null);

    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const cleanEmail = email.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName?.trim() || cleanEmail.split('@')[0],
          },
          emailRedirectTo: redirectOrigin,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return { success: false, error: signUpError.message };
      }

      // Check whether email confirmation is required:
      // When email confirmation is enabled, Supabase returns data.user, but data.session is null!
      // We must NOT falsely mark this user as signed in.
      if (data.user && !data.session) {
        setPendingConfirmationEmail(cleanEmail);
        setAuthModalMode('confirmation_sent');
        return { success: true, needsConfirmation: true };
      }

      // If a session was immediately established (e.g. email confirmation off or mock)
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setIsAuthModalOpen(false);
        return { success: true, needsConfirmation: false };
      }

      return { success: true, needsConfirmation: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsActionLoading(false);
    }
  };

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured' };
    }

    if (isActionLoading) {
      return { success: false, error: 'Authentication request already in progress' };
    }

    setIsActionLoading(true);
    setError(null);

    try {
      const isNativeApp = typeof window !== 'undefined' && Capacitor.isNativePlatform();
      const redirectOrigin = isNativeApp
        ? 'com.habitflow.app://auth/callback'
        : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
      
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectOrigin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        setIsActionLoading(false);
        setError(oauthError.message);
        return { success: false, error: oauthError.message };
      }

      // Browser will redirect to Google authentication
      return { success: true };
    } catch (err: unknown) {
      setIsActionLoading(false);
      const msg = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      // On web the page redirects; on native Android keep loading until browser opens or app state changes
      if (!Capacitor.isNativePlatform()) {
        setIsActionLoading(false);
      }
    }
  };

  // Sign Out (Safely preserves all local habits, budget, debts & stats)
  const signOut = async () => {
    setIsActionLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err: unknown) {
      console.warn('[HabitFlow Auth] Sign out error:', err);
    } finally {
      // Local state reset without touching localStorage habits or XP
      setSession(null);
      setUser(null);
      setError(null);
      setIsActionLoading(false);
    }
  };

  // Password reset request
  const resetPasswordForEmail = async (email: string) => {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured' };
    }

    setIsActionLoading(true);
    setError(null);

    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${redirectOrigin}/#reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return { success: false, error: resetError.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsActionLoading(false);
    }
  };

  const authUser = extractAuthUser(user);
  const isAuthenticated = Boolean(user && session);
  const isGuest = !isAuthenticated;

  const value: AuthContextType = {
    user,
    session,
    authUser,
    isAuthenticated,
    isGuest,
    isLoading,
    isActionLoading,
    isConfigured: isSupabaseConfigured,
    error,
    isAuthModalOpen,
    authModalMode,
    pendingConfirmationEmail,
    openAuthModal,
    closeAuthModal,
    continueAsGuest,
    setAuthModalMode,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPasswordForEmail,
    clearError,
    clearPendingConfirmation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
