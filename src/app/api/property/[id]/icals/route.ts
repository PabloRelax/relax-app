// src/app/api/property/[id]/icals/route.ts
import { createServerClient } from '@supabase/ssr'; // Use @supabase/ssr
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request, context: { params: { id: string } }) {
  // Resolve the promise returned by cookies()
  const cookieStore = await cookies();  // Await cookies() to resolve the promise
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore,
    }
  );
  
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
