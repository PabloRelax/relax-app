// src/app/api/property/[id]/icals/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request, context: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const propertyId = parseInt(context.params.id, 10);

  if (isNaN(propertyId)) {
    return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('property_icals')
    .select('url, platform')
    .eq('property_id', propertyId)
    .eq('active', true);

  if (error) {
    console.error('Error fetching iCals:', error.message);
    return NextResponse.json({ error: 'Failed to fetch iCal data' }, { status: 500 });
  }

  return NextResponse.json({ icals: data });
}
