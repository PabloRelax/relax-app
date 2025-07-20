// src/app/api/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  }

  const response = NextResponse.redirect(new URL('/operations', requestUrl.origin));
  const cookieStore = await getCookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => cookieStore.get(key)?.value,
        set: (key, value, options) => {
          // ✅ Set path explicitly
          response.cookies.set(key, value, { ...options, path: '/' });
        },
        remove: (key, options) => {
          response.cookies.set(key, '', { ...options, maxAge: -1, path: '/' });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('❌ Auth error:', error.message);
    return NextResponse.redirect(new URL('/?error=auth', requestUrl.origin));
  }

  return response;
}
