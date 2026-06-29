'use client';

import { useState } from 'react';

import { RoleSelect } from '@/components/admin/RoleSelect';
import { deleteAdminUser, updateUserRole } from '@/services/AdminService';
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
    if (!confirm('Delete this user permanently?')) return;
    setLoading(true);
    try {
      await deleteAdminUser(user.id);
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="border-t border-white/5">
      <td className="px-3 py-3 text-xs text-zinc-400">{user.id.slice(0, 8)}…</td>
      <td className="px-3 py-3 text-sm">{user.display_name ?? '—'}</td>
      <td className="px-3 py-3">
        <RoleSelect value={user.role} onChange={handleRole} />
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleDelete}
          className="text-xs text-red-400 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
