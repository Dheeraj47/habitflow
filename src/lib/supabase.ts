import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials safely from Vite environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

// Validate configuration without logging or leaking secret values
const isValidUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseKey &&
  isValidUrl(supabaseUrl) &&
  supabaseKey.trim().length > 0
);

if (!isSupabaseConfigured) {
  if (import.meta.env.DEV) {
    console.warn(
      '[HabitFlow] Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY) are missing or incomplete. Supabase cloud features will operate in local fallback mode.'
    );
  }
}

/**
 * Supabase client instance.
 * Initialized only when valid environment credentials are provided.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface SupabaseConnectionStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  error?: string;
}

/**
 * Minimal, non-destructive connection health check.
 * Verifies network reachability to the project auth endpoint without
 * reading, creating, or modifying any database records.
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      configured: false,
      connected: false,
      message: 'Supabase credentials are not configured in .env.local',
    };
  }

  try {
    // Non-destructive auth session query to verify project connectivity
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        configured: true,
        connected: false,
        message: 'Supabase endpoint responded with error',
        error: error.message,
      };
    }

    return {
      configured: true,
      connected: true,
      message: 'Successfully established connection to Supabase endpoint',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      configured: true,
      connected: false,
      message: 'Failed to reach Supabase endpoint',
      error: errorMsg,
    };
  }
}
