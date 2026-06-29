import type { UserRole } from '@/types/Auth';

export type DbUserRole = Exclude<UserRole, 'Guest'>;

export interface AdminUser {
  id: string;
  role: DbUserRole;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error('Failed to load users');
  return res.json() as Promise<AdminUser[]>;
}

export async function updateUserRole(id: string, role: DbUserRole): Promise<void> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Failed to update role');
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete user');
}
