// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';

export async function getSupabaseServerClient() {
  const cookieStore = await getCookies(); // ✅ usar await aquí

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: (key) => cookieStore.get(key)?.value,
        set() {}, // no-op
        remove() {}, // no-op
      },
    }
  );
}
