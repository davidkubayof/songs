import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import type { AdminUser } from '@/services/AdminService';

function profileFromAuthUser(user: {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}) {
  const fullName = user.user_metadata.full_name;
  const avatarUrl = user.user_metadata.avatar_url;
  return {
    id: user.id,
    display_name:
      typeof fullName === 'string'
        ? fullName
        : user.email ?? null,
    avatar_url: typeof avatarUrl === 'string' ? avatarUrl : null,
  };
}

export async function getAdminUsers(includeDeleted = false): Promise<AdminUser[]> {
  const admin = createAdminClient();

  const authUsers = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    authUsers.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }

  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id');

  if (profilesError) throw new Error(profilesError.message);

  const profileIds = new Set(profiles?.map((p) => p.id) ?? []);
  const missing = authUsers.filter((user) => !profileIds.has(user.id));

  if (missing.length > 0) {
    const { error: upsertError } = await admin
      .from('profiles')
      .upsert(missing.map(profileFromAuthUser), { onConflict: 'id', ignoreDuplicates: true });

    if (upsertError) throw new Error(upsertError.message);
  }

  let query = admin
    .from('profiles')
    .select('id, role, display_name, avatar_url, created_at, is_deleted')
    .order('created_at', { ascending: false });

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data ?? [];
}
