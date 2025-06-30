// src\app\api\property\[id]\has-ical\route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const propertyId = Number(params.id);

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
