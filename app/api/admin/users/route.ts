import { NextResponse } from 'next/server';

import { getAdminUsers } from '@/lib/getAdminUsers';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await getAdminUsers();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load users';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
