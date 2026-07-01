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
    .eq('is_deleted', false)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data as ProfileRow);
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: { displayName?: string },
): Promise<Profile> {
  const payload: Record<string, string> = {};
  if (updates.displayName !== undefined) payload.display_name = updates.displayName;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('id, role, display_name, avatar_url')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to update profile');
  return mapProfile(data as ProfileRow);
}
