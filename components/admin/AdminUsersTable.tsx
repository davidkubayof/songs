'use client';

import { useCallback, useState } from 'react';
import { Users } from 'lucide-react';

import { AdminUserRow } from '@/components/admin/AdminUserRow';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchAdminUsers } from '@/services/AdminService';
import type { AdminUser } from '@/services/AdminService';

interface AdminUsersTableProps {
  initialUsers: AdminUser[];
}

export function AdminUsersTable({ initialUsers }: AdminUsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setUsers(await fetchAdminUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  if (error) {
    return (
      <EmptyState icon={Users} title="Unable to load users" description={error} />
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState icon={Users} title="No users yet" description="Registered users will appear here." />
    );
  }

  return (
    <GlassPanel className="overflow-x-auto p-2">
      <table className="w-full min-w-[480px] text-left">
        <thead>
          <tr className="text-xs text-zinc-500">
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <AdminUserRow key={user.id} user={user} onUpdated={refresh} />
          ))}
        </tbody>
      </table>
    </GlassPanel>
  );
}
