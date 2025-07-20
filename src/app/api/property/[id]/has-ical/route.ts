import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from 'types/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = Number(params.id);
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }

    // Properly await the cookies() function
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

    const { data, error } = await supabase
      .from('property_icals')
      .select('id')
      .eq('property_id', propertyId as never)
      .eq('active', true as never)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ hasIcal: !!data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
  }
}