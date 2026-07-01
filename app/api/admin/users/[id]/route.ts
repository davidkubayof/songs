import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/requireAdmin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  if (body.restore === true) {
    const { error } = await admin.from('profiles').update({ is_deleted: false }).eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const role = body.role as string;
  if (!['FreeUser', 'PremiumUser', 'Admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('is_deleted')
    .eq('id', id)
    .maybeSingle();

  if (profile?.is_deleted) {
    return NextResponse.json({ error: 'Cannot update role of deleted user' }, { status: 400 });
  }

  const { error } = await admin.from('profiles').update({ role }).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (id === auth.user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('is_deleted')
    .eq('id', id)
    .maybeSingle();

  if (profile?.is_deleted) {
    return NextResponse.json({ error: 'User already deleted' }, { status: 400 });
  }

  const { error } = await admin.from('profiles').update({ is_deleted: true }).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
