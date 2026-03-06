import { createClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof typeof target];
  }
});

export function getSupabaseAdminClient() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = getSupabaseUrl();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || getSupabaseAnonKey();
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must be set');
    }
    const usingServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[SUPABASE DEBUG] Admin client - URL:', supabaseUrl?.substring(0, 30) + '...', 'usingServiceRole:', usingServiceRole);
    supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey);
  }
  return supabaseAdminInstance;
}

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    return getSupabaseAdminClient()[prop as keyof typeof target];
  }
});
