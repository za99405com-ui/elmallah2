import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized Supabase Client
let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.SUPABASE_ANON_KEY || 
              (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined);

  if (url && key && url !== 'https://your-project.supabase.co') {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false
        }
      });
      console.log('✅ Supabase client successfully initialized for El-Mallah Seafood');
    } catch (e) {
      console.warn('⚠️ Failed to initialize Supabase client:', e);
    }
  }
  return supabaseClient;
}
