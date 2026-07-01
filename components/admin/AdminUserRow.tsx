'use client';

import { useState } from 'react';

import { RoleSelect } from '@/components/admin/RoleSelect';
import { deleteAdminUser, restoreAdminUser, updateUserRole } from '@/services/AdminService';
import type { AdminUser, DbUserRole } from '@/services/AdminService';

interface AdminUserRowProps {
  user: AdminUser;
  onUpdated: () => void;
}

export function AdminUserRow({ user, onUpdated }: AdminUserRowProps) {
  const [loading, setLoading] = useState(false);

  const handleRole = async (role: DbUserRole) => {
    setLoading(true);
    try {
      await updateUserRole(user.id, role);
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deactivate this user?')) return;
    setLoading(true);
    try {
      await deleteAdminUser(user.id);
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('Restore this user?')) return;
    setLoading(true);
    try {
      await restoreAdminUser(user.id);
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className={`border-t border-white/5 ${user.is_deleted ? 'opacity-60' : ''}`}>
      <td className="px-3 py-3 text-xs text-zinc-400">{user.id.slice(0, 8)}…</td>
      <td className="px-3 py-3 text-sm">
        {user.display_name ?? '—'}
        {user.is_deleted && (
          <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
            Deleted
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        {user.is_deleted ? (
          <span className="text-xs text-zinc-500">{user.role}</span>
        ) : (
          <RoleSelect value={user.role} onChange={handleRole} />
        )}
      </td>
      <td className="px-3 py-3">
        {user.is_deleted ? (
          <button
            type="button"
            disabled={loading}
            onClick={handleRestore}
            className="text-xs text-emerald-400 hover:underline disabled:opacity-50"
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="text-xs text-red-400 hover:underline disabled:opacity-50"
          >
            Deactivate
          </button>
        )}
      </td>
    </tr>
  );
}
