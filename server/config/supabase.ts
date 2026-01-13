import { createClient, SupabaseClient } from '@supabase/supabase-js'
import envs from './vars'

// Client for authenticated user operations (uses anon key)
export const supabase = createClient(
  envs.SUPABASE_URL!,
  envs.SUPABASE_ANON_KEY!
)

// Admin client for service operations (uses service role key)
// Use this for operations that bypass Row Level Security
export const supabaseAdmin = createClient(
  envs.SUPABASE_URL!,
  envs.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export type { SupabaseClient }
