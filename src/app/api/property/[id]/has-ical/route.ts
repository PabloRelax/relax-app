import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Extract propertyId from the URL path (e.g., /api/property/[id]/has-ical)
    const url = new URL(request.url);
    const propertyId = Number(url.pathname.split('/')[3]); // assuming the path is /property/[id]/has-ical

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
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
      .select('id')
      .eq('property_id', propertyId)
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ hasIcal: !!data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
  }
}
