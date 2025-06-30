// src/app/api/sync-ical-all/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 1. Get all active properties with valid platform_user_id
    const { data: properties, error: propertyError } = await supabase
      .from('properties')
      .select('id, platform_user_id')
      .eq('status', 'active');

    if (propertyError) throw new Error(`Error fetching properties: ${propertyError.message}`);
    if (!properties || properties.length === 0) return NextResponse.json({ message: 'No active properties found.' });

    const syncResults: { propertyId: number; icalUrl: string; status: string; error?: string }[] = [];

    // 2. Loop over properties
    for (const { id: propertyId, platform_user_id } of properties) {
      if (!platform_user_id) {
        console.warn(`Property ${propertyId} has no platform_user_id — skipping.`);
        continue;
      }

      // 3. Get all active iCals for this property
      const { data: icals, error: icalError } = await supabase
        .from('property_icals')
        .select('url')
        .eq('property_id', propertyId)
        .eq('active', true);

      if (icalError) {
        console.error(`Error fetching iCals for property ${propertyId}:`, icalError.message);
        syncResults.push({ propertyId, icalUrl: '', status: 'error', error: icalError.message });
        continue;
      }

      if (!icals || icals.length === 0) {
        syncResults.push({ propertyId, icalUrl: '', status: 'skipped', error: 'No active iCals found.' });
        continue;
      }

      // 4. Loop over iCals and sync each
      for (const { url } of icals) {
        try {
          const syncRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync-ical`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              property_id: propertyId,
              platform_user_id,
            }),
          });

          const syncData = await syncRes.json();
          if (!syncRes.ok) {
            syncResults.push({ propertyId, icalUrl: url, status: 'failed', error: syncData.error || 'Unknown error' });
          } else {
            syncResults.push({ propertyId, icalUrl: url, status: 'success' });
          }
        } catch (err: any) {
          console.error(`Sync error for property ${propertyId}, URL ${url}:`, err.message);
          syncResults.push({ propertyId, icalUrl: url, status: 'error', error: err.message });
        }
      }

      // 5. Generate cleaning tasks for the property after syncing all iCals
      try {
        // First get the newly created reservations (moved BEFORE the fetch call)
        const { data: newReservations } = await supabase
          .from('reservations')
          .select('id')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(10);

        console.log(`Found ${newReservations?.length} reservations for property ${propertyId}`);

        const taskRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/generate-cleaning-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            property_id: propertyId,
            reservation_ids: newReservations?.map(r => r.id) || [] 
          }),
        });

        if (!taskRes.ok) {
          const taskError = await taskRes.json();
          console.error(`Task generation failed for property ${propertyId}:`, taskError.error);
        } else {
          const taskData = await taskRes.json();
          console.log(`Tasks generated for property ${propertyId}:`, taskData);
        }
      } catch (taskErr: any) {
        console.error(`Error triggering task generation for property ${propertyId}:`, taskErr.message);
      }
    }

    return NextResponse.json({ message: 'Sync complete', results: syncResults });
  } catch (err: any) {
    console.error('Unexpected error:', err.message);
    return NextResponse.json({ error: 'Unexpected error: ' + err.message }, { status: 500 });
  }
}
