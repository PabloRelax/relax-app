// src/app/api/property/[id]/icals/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
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

    const cookieStore = await cookies();
    
    const supabase = await getSupabaseServerClient(); // Await the Supabase client

    const { data, error } = await supabase
      .from('property_icals')
      .select('id')
      .eq('property_id', propertyId) // No need to cast propertyId as `never`
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
