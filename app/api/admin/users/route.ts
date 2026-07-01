import { NextResponse } from 'next/server';

import { getAdminUsers } from '@/lib/getAdminUsers';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const includeDeleted = searchParams.get('includeDeleted') === '1';

  try {
    const data = await getAdminUsers(includeDeleted);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load users';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
