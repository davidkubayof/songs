import { NextResponse, type NextRequest } from 'next/server';

import { ADMIN_PREFIX } from '@/constants/auth';
import { createProxyClient } from '@/lib/supabase-proxy';

export async function proxy(request: NextRequest) {
  const { supabase, response } = createProxyClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PREFIX)) return response;

  if (!user) {
    const login = new URL('/auth/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'Admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
