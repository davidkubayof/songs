import type { SupabaseClient } from '@supabase/supabase-js';

export async function restoreDeletedUser(supabase: SupabaseClient): Promise<void> {
  await supabase.rpc('restore_own_profile');
}
