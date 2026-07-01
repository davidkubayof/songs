import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import type { AdminUser } from '@/services/AdminService';

export async function getAdminUsers(): Promise<AdminUser[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, role, display_name, avatar_url, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
