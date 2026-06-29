import { AdminUsersTable } from '@/components/admin/AdminUsersTable';

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage users and roles</p>
      </header>
      <AdminUsersTable />
    </div>
  );
}
