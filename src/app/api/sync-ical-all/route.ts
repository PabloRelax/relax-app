// src/app/api/sync-ical-all/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Configuration constants
const BATCH_SIZE = 20; // Process 20 properties at a time
const MAX_RETRIES = 2; // Retry failed syncs up to 2 times

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // 1. Fetch only active properties with at least one active, non-null iCal
    const { data: properties, count: totalProperties, error: propertyError } = await supabase
      .from('properties')
      .select('id, platform_user_id, property_icals!inner(id)', { count: 'exact' })
      .eq('status', 'active')
      .eq('property_icals.active', true)
      .not('property_icals.url', 'is', null);

    if (propertyError) throw new Error(`Error fetching properties: ${propertyError.message}`);
    if (!properties) throw new Error(`No properties returned from Supabase query.`);

    console.log(`Starting sync for ${totalProperties} active properties`);

    // 2. Process in batches
    let processed = 0;
    let page = 0;
    const syncResults = [];

    while (processed < totalProperties!) {
      const propertiesToProcess = properties.slice(page * BATCH_SIZE, (page + 1) * BATCH_SIZE);

      // Process each property in batch
      for (const { id: propertyId, platform_user_id } of propertiesToProcess) {
      //for (const { id: propertyId, platform_user_id } of properties) { all properties pablo
        if (!platform_user_id) {
          console.warn(`Property ${propertyId} has no platform_user_id — skipping.`);
          syncResults.push({ propertyId, status: 'skipped', error: 'No platform_user_id' });
          continue;
        }

        let retries = 0;
        let success = false;

        // Retry logic
        while (retries <= MAX_RETRIES && !success) {
          try {
            const icals = await getActiveICals(supabase, propertyId);
            
            if (!icals.length) {
              syncResults.push({ propertyId, status: 'skipped', error: 'No active iCals' });
              success = true;
              continue;
            }

            // Process each iCal
            for (const { url } of icals) {
              const result = await syncICal(
                propertyId, 
                platform_user_id, 
                url,
                retries
              );
              syncResults.push(result);
            }

            // Generate cleaning tasks after successful sync
            await generateCleaningTasks(propertyId);
            success = true;
          } catch (error) {
            retries++;
            if (retries > MAX_RETRIES) {
              syncResults.push({
                propertyId,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Sync failed'
              });
            }
          }
        }

        processed++;
        console.log(`Processed ${processed}/${totalProperties} properties`);
      }

      page++;
    }

    return NextResponse.json({ 
      message: 'Sync complete',
      stats: {
        total: totalProperties,
        succeeded: syncResults.filter(r => r.status === 'success').length,
        failed: syncResults.filter(r => r.status === 'failed').length,
        skipped: syncResults.filter(r => r.status === 'skipped').length
      },
      results: syncResults 
    });

  } catch (err: any) {
    console.error('Unexpected error:', err.message);
    return NextResponse.json({ 
      error: 'Unexpected error: ' + err.message 
    }, { status: 500 });
  }
}

// Helper functions
async function getActiveICals(supabase: any, propertyId: number) {
  const { data, error } = await supabase
    .from('property_icals')
    .select('url')
    .eq('property_id', propertyId)
    .eq('active', true);

  if (error) throw error;
  return data || [];
}

async function syncICal(propertyId: number, platformUserId: string, url: string, attempt: number) {
  try {
    const syncRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync-ical`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
      },
      body: JSON.stringify({ property_id: propertyId, platform_user_id: platformUserId })
    });

    if (!syncRes.ok) {
      const errorData = await syncRes.json();
      throw new Error(errorData.error || 'Sync failed');
    }

    return { 
      propertyId, 
      icalUrl: url, 
      status: 'success',
      attempt: attempt + 1 
    };
  } catch (error) {
    throw error;
  }
}

async function generateCleaningTasks(propertyId: number) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/generate-cleaning-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: propertyId })
    });
  } catch (error) {
    console.error(`Task generation failed for property ${propertyId}:`, error);
  }
}