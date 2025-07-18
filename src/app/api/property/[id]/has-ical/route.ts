// src/app/api/property/[id]/has-ical/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'types/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json(
        { error: 'Invalid property ID' }, 
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

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
    console.error('Error in has-ical route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}