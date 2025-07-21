// relax-app\src\app\api\property\[id]\icals\route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from 'types/supabase';

export async function GET(request: Request) {
  try {
    // Use new NextRequest pattern for dynamic params
    const url = new URL(request.url);
    const propertyId = Number(url.pathname.split('/')[3]); // Extract id from URL (e.g., /property/[id]/has-ical)

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }

    // Handle cookies asynchronously
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Query Supabase for the iCal data related to propertyId
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
