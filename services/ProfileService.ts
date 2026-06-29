import type { SupabaseClient } from '@supabase/supabase-js';

import type { Profile, UserRole } from '@/types/Auth';

interface ProfileRow {
  id: string;
  role: 'FreeUser' | 'PremiumUser' | 'Admin';
  display_name: string | null;
  avatar_url: string | null;
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role as UserRole,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data as ProfileRow);
}
