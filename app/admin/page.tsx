import { redirect } from 'next/navigation';

import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { getAdminUsers } from '@/lib/getAdminUsers';
import { requireAdmin } from '@/lib/requireAdmin';

export default async function AdminPage() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    if (auth.status === 401) redirect('/auth/login?next=/admin');
    redirect('/');
  }

  const users = await getAdminUsers();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage users and roles</p>
      </header>
      <AdminUsersTable initialUsers={users} />
    </div>
  );
}
