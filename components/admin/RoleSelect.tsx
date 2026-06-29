'use client';

import type { DbUserRole } from '@/services/AdminService';

const ROLES: DbUserRole[] = ['FreeUser', 'PremiumUser', 'Admin'];

interface RoleSelectProps {
  value: DbUserRole;
  onChange: (role: DbUserRole) => void;
}

export function RoleSelect({ value, onChange }: RoleSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DbUserRole)}
      className="rounded-lg bg-white/5 px-2 py-1 text-xs outline-none"
    >
      {ROLES.map((role) => (
        <option key={role} value={role} className="bg-zinc-900">
          {role}
        </option>
      ))}
    </select>
  );
}
