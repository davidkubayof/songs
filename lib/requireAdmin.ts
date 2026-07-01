import { createClient } from '@/lib/supabase-server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_deleted')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.is_deleted || profile.role !== 'Admin') {
    return { error: 'Forbidden', status: 403 as const };
  }

  return { user };
}
