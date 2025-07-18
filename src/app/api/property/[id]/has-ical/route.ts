// src/app/api/property/[id]/has-ical/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'types/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;
  const propertyId = Number(id);

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  if (isNaN(propertyId)) {
    return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('property_icals')
    .select('id')
    .eq('property_id', propertyId)
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Supabase query error:', error);
    return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ hasIcal: !!data });
}