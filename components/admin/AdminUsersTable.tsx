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
  const [showDeleted, setShowDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setUsers(await fetchAdminUsers(showDeleted));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, [showDeleted]);

  const toggleDeleted = async () => {
    const next = !showDeleted;
    setShowDeleted(next);
    setError(null);
    try {
      setUsers(await fetchAdminUsers(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  if (error) {
    return (
      <EmptyState icon={Users} title="Unable to load users" description={error} />
    );
  }

  const activeUsers = showDeleted ? users.filter((u) => !u.is_deleted) : users;
  const deletedUsers = showDeleted ? users.filter((u) => u.is_deleted) : [];

  if (!showDeleted && users.length === 0) {
    return (
      <EmptyState icon={Users} title="No users yet" description="Registered users will appear here." />
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={showDeleted}
          onChange={toggleDeleted}
          className="rounded border-white/20 bg-white/5"
        />
        Show deleted users
      </label>

      {activeUsers.length > 0 && (
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
              {activeUsers.map((user) => (
                <AdminUserRow key={user.id} user={user} onUpdated={refresh} />
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      {showDeleted && deletedUsers.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-400">Deleted users</h2>
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
                {deletedUsers.map((user) => (
                  <AdminUserRow key={user.id} user={user} onUpdated={refresh} />
                ))}
              </tbody>
            </table>
          </GlassPanel>
        </div>
      )}

      {showDeleted && activeUsers.length === 0 && deletedUsers.length === 0 && (
        <EmptyState icon={Users} title="No users" description="No active or deleted users found." />
      )}
    </div>
  );
}
