// src/app/api/property/[id]/icals/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from 'types/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const propertyId = Number(url.pathname.split('/')[3]);
    console.log('🔍 propertyId:', propertyId);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
          setAll: (cookiesToSet) => {
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie);
            }
          },
        },
      }
    );

    const { data, error } = await supabase
      .from('property_icals')
      .select('id, url')
      .eq('property_id', propertyId)
      .eq('active', true);

    if (error) throw error;

    return NextResponse.json({ icals: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
  }
}
