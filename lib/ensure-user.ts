import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Ensures the auth user exists in the public.users table (for foreign key constraints).
 * Call this after get user in any API route that uses user_id.
 */
export async function ensureUser(
  adminSupabase: SupabaseClient,
  authUser: User
): Promise<void> {
  const fullName = authUser.user_metadata?.full_name ?? authUser.user_metadata?.fullName ?? null
  const now = new Date().toISOString()
  await adminSupabase.from('users').upsert(
    {
      id: authUser.id,
      email: authUser.email ?? '',
      full_name: fullName,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'id' }
  )
}
