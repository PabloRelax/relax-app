// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          cookieStore.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          })),
        setAll: (cookiesToSet) => {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie);
          }
        },
      },
    }
  );
}
