// src/app/api/sync-ical/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ical from 'ical.js';
import { fetchAirbnbICal } from '@/lib/fetchAirbnbICal';

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  console.log('>> sync-ical handler reached');
  
  try {
    const { property_id, platform_user_id } = await request.json();

    if (!platform_user_id) {
      return new Response(JSON.stringify({ error: 'Missing platform_user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!property_id) {
      return new Response(JSON.stringify({ error: 'Missing property_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const propertiesToSync = [{ id: property_id }];

    const reservationsToInsert: {
      property_id: number;
      platform_user_id: string;
      start_date: string;
      end_date: string;
      guest_name: string | null;
      reservation_uid: string;
      source: string;
      status: string;
      notes: string;
    }[] = [];

    const supabase = await createSupabaseServerClient();  // Await the Supabase client

    for (const { id: propId } of propertiesToSync) {

      // Use the client to query the property_icals table
      const { data: icals, error: icalsError } = await supabase
        .from('property_icals')
        .select('url, platform') 
        .eq('property_id', propId)
        .eq('active', true);

      if (icalsError) {
        console.error(`Error fetching iCals for property ${propId}:`, icalsError.message);
        continue;
      }

      if (!icals || icals.length === 0) {
        console.warn(`No active iCals found for property ${propId}`);
        continue;
      }

      const existingReservationUids = new Set<string>();
      const { data: existingReservations, error: fetchExistingError } = await supabase
        .from('reservations')
        .select('reservation_uid')
        .eq('property_id', propId);


      if (!fetchExistingError && existingReservations) {
        existingReservations.forEach(res => {
          if (typeof res.reservation_uid === 'string') {
            existingReservationUids.add(res.reservation_uid);
          }
        });
      }

      for (const { url: ical_url, platform: knownSource } of icals) {
        try {
          const icalText = await fetchAirbnbICal(ical_url);
          const jcalData = ical.parse(icalText);
          const comp = new ical.Component(jcalData);
          const vevents = comp.getAllSubcomponents('vevent');
          console.log(`📅 Found ${vevents.length} events in ${ical_url} for property ${propId}`);

          for (const vevent of vevents) {
            const rawSummary = vevent.getFirstPropertyValue('summary');
            const rawDescription = vevent.getFirstPropertyValue('description');
            const uid = vevent.getFirstPropertyValue('uid');
            const dtstart = vevent.getFirstPropertyValue('dtstart');
            const dtend = vevent.getFirstPropertyValue('dtend');
            const rawStatus = vevent.getFirstPropertyValue('status');
            const status = typeof rawStatus === 'string' ? rawStatus : 'confirmed';

            let guestName: string | null = null;
            let bookingSource: string = knownSource || 'Other';
            const summaryText = typeof rawSummary === 'string' ? rawSummary.trim() : '';
            const descriptionText = typeof rawDescription === 'string' ? rawDescription.trim() : '';

            console.log(`🧾 Summary: "${summaryText}"`);

            if (/not available/i.test(summaryText)) continue;

            const channelFromDescriptionMatch = descriptionText.match(/Channel:\s*([^ \n]+)/i);
            if (channelFromDescriptionMatch && channelFromDescriptionMatch[1]) {
              bookingSource = channelFromDescriptionMatch[1];
            }

            if (bookingSource === 'Other' && summaryText) {
              const sourceInSummaryMatch = summaryText.match(/\((.*?)\)/) as RegExpMatchArray | null;
              if (sourceInSummaryMatch?.[1]) {
                bookingSource = sourceInSummaryMatch[1];
              }
            }

            const genericSummaryPattern = /\((.+?)\)\s*-\s*by\s*(.+)/i;
            if (summaryText.match(genericSummaryPattern)) {
              guestName = 'Guest';
            } else if (summaryText) {
              guestName = summaryText.toLowerCase().includes('reserved') ? null : summaryText;
            }

            if (bookingSource === 'Other') {
              if (ical_url.includes('airbnb.com')) bookingSource = 'Airbnb';
              else if (ical_url.includes('guesty.com')) bookingSource = 'Guesty';
              else if (ical_url.includes('vrbo.com')) bookingSource = 'Vrbo';
              else if (ical_url.includes('booking.com')) bookingSource = 'Booking.com';
              else if (ical_url.includes('hostaway.com')) bookingSource = 'Hostaway';
            }

            console.log({
              uid,
              dtstartType: dtstart?.constructor?.name,
              dtendType: dtend?.constructor?.name,
              isUidString: typeof uid === 'string',
            });

            if (dtstart instanceof ical.Time && dtend instanceof ical.Time && typeof uid === 'string') {
              const startDate = formatDateToYYYYMMDD(dtstart.toJSDate());
              const endDate = formatDateToYYYYMMDD(dtend.toJSDate());

              const reservationData = {
                property_id: propId,
                platform_user_id,
                start_date: startDate,
                end_date: endDate,
                guest_name: guestName,
                reservation_uid: uid,
                source: bookingSource,
                status,
                notes: descriptionText,
              };

              reservationsToInsert.push(reservationData);
            }
          }
        } catch (error: unknown) {
          const errMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error processing iCal ${ical_url} for property ${propId}:`, errMessage);
          continue;
        }
      }
    }

    if (reservationsToInsert.length === 0) {
      console.warn('⚠️ No reservations to insert. Skipping upsert.');
      return Response.json({ message: 'No new reservations found.' });
    }

    console.log('>> Preparing to upsert reservations:', reservationsToInsert.length);
    console.dir(reservationsToInsert, { depth: null });

    console.log('Will attempt to upsert this many reservations:', reservationsToInsert.length);

    console.log('Sample reservation data being upserted:', {
      sample: reservationsToInsert[0],
      types: {
        property_id: typeof reservationsToInsert[0]?.property_id,
        platform_user_id: typeof reservationsToInsert[0]?.platform_user_id,
        start_date: typeof reservationsToInsert[0]?.start_date,
        end_date: typeof reservationsToInsert[0]?.end_date
      }
    });
    
    const { data: upsertedReservations, error: upsertError } = await supabase
      .from('reservations')
      .upsert(reservationsToInsert, { onConflict: 'reservation_uid' })
      .select();

    console.log('Upsert result:', { 
      data: upsertedReservations, 
      error: upsertError,
      count: upsertedReservations?.length 
    });

    if (upsertError) {
      console.error('Error upserting reservations:', upsertError);
      return Response.json(
        { error: 'Failed to save reservations: ' + upsertError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully upserted ${upsertedReservations.length} reservations.`);

    // If syncing a single property, trigger cleaning task generation
    if (property_id) {
      try {
        const taskRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/generate-cleaning-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ property_id }),
        });

        const text = await taskRes.text();
        if (!taskRes.ok) throw new Error(text);
        const taskData = JSON.parse(text);

        return Response.json({
          message: 'iCal synced and cleaning tasks generated successfully',
          syncedReservations: reservationsToInsert.length,
          ...taskData,
        });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : String(error);
        console.error('Error during generate-cleaning-tasks call:', errMessage);
        return Response.json(
          {
            error: 'Reservations saved, but task generation failed',
            details: errMessage,
          },
          { status: 500 }
        );
      }
    }

    return Response.json({
      message: 'iCals synced for all active properties',
      syncedReservations: reservationsToInsert.length,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('iCal sync API error:', errorMessage);
    return Response.json({ error: 'iCal sync failed: ' + errorMessage }, { status: 500 });
  }
}
