// src/app/api/sync-ical/route.ts
// import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // CHANGED IMPORT
import { cookies } from 'next/headers'; // NEW IMPORT

import ical from 'ical.js';
import fetch from 'node-fetch';

// NEW HELPER FUNCTION: Format a Date object to YYYY-MM-DD in local time
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  // Initialize Supabase client for server-side operations with user's session
  const supabase = createRouteHandlerClient({ cookies }); // CHANGED INITIALIZATION

  try {
    const { ical_url, property_id, platform_user_id } = await request.json();

    if (!ical_url || !property_id || !platform_user_id) {
      return new Response(JSON.stringify({ error: 'Missing ical_url, property_id, or platform_user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });

    }

    // 1. Fetch iCal content
    const response = await fetch(ical_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: ${response.statusText}`);
    }
    const icalText = await response.text();

    // 2. Parse iCal content
    const jcalData = ical.parse(icalText);
    const comp = new ical.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    const reservationsToInsert = [];
    const existingReservationUids = new Set<string>(); // To track existing UIDs for updates

    // Fetch existing reservation UIDs for this property to prevent duplicates and enable updates
    const { data: existingReservations, error: fetchExistingError } = await supabase
      .from('reservations')
      .select('reservation_uid')
      .eq('property_id', property_id);

    if (fetchExistingError) {
      console.error('Error fetching existing reservations UIDs:', fetchExistingError);
    } else if (existingReservations) {
      existingReservations.forEach(res => {
        if (typeof res.reservation_uid === 'string') {
          existingReservationUids.add(res.reservation_uid);
        }
      });
    }

        for (const vevent of vevents) {
          // Get raw values first
          const rawSummary = vevent.getFirstPropertyValue('summary');
          const rawDescription = vevent.getFirstPropertyValue('description');
          const uid = vevent.getFirstPropertyValue('uid');
          const dtstart = vevent.getFirstPropertyValue('dtstart');
          const dtend = vevent.getFirstPropertyValue('dtend');
          const status = vevent.getFirstPropertyValue('status') || 'confirmed';

          // --- NEW: Smart Parsing Logic for guest_name and source ---
          let guestName: string | null = null;
          let bookingSource: string = 'Other';
          const summaryText = typeof rawSummary === 'string' ? rawSummary.trim() : '';
          const descriptionText = typeof rawDescription === 'string' ? rawDescription.trim() : '';

          // 1. Try to extract source from DESCRIPTION (e.g., "Channel: airbnbOfficial")
          const channelFromDescriptionMatch = descriptionText.match(/Channel:\s*([^ \n]+)/i); // Capture group for the channel name
          if (channelFromDescriptionMatch && channelFromDescriptionMatch[1]) {
            bookingSource = channelFromDescriptionMatch[1];
          }

          // 2. Try to extract source from SUMMARY (e.g., "(airbnbOfficial)") if not found in description
          if (bookingSource === 'Other' && summaryText) {
            const sourceInSummaryMatch = summaryText.match(/\((.*?)\)/);
            if (sourceInSummaryMatch && sourceInSummaryMatch[1]) {
              bookingSource = sourceInSummaryMatch[1];
            }
          }

          // 3. Determine guest_name (prefer explicit name, otherwise generic or null)
          // If summary seems to be just channel info, use 'Guest' or null for guestName
          // Example: "(airbnbOfficial) - by Hostaway"
          const genericSummaryPattern = /\((.+?)\)\s*-\s*by\s*(.+)/i;
          if (summaryText.match(genericSummaryPattern)) {
            guestName = 'Guest'; // Or you can set to null if preferred: guestName = null;
          } else if (summaryText) {
            guestName = summaryText; // Otherwise, assume summary is the guest name
          }

          // 4. Fallback for bookingSource if not found in summary/description
          if (bookingSource === 'Other') {
            if (ical_url.includes('airbnb.com')) {
              bookingSource = 'Airbnb';
            } else if (ical_url.includes('guesty.com')) {
              bookingSource = 'Guesty';
            } else if (ical_url.includes('vrbo.com')) {
              bookingSource = 'Vrbo';
            } else if (ical_url.includes('booking.com')) {
              bookingSource = 'Booking.com';
            } else if (ical_url.includes('hostaway.com')) {
              bookingSource = 'Hostaway';
            }
          }
          // --- END NEW Parsing Logic ---


          if (dtstart && dtend && uid && (dtstart instanceof ical.Time) && (dtend instanceof ical.Time) && (typeof uid === 'string')) {
            // Get JS Date objects first
            const jsStartDate = dtstart.toJSDate();
            const jsEndDate = dtend.toJSDate();

            // FIX: Use the helper function to format dates, keeping local time components
            const startDate = formatDateToYYYYMMDD(jsStartDate);
            const endDate = formatDateToYYYYMMDD(jsEndDate);

            // ... (rest of the code for reservationData remains the same)
            const reservationData = {
              property_id: property_id,
              platform_user_id: platform_user_id,
              start_date: startDate, // Now correctly formatted
              end_date: endDate,     // Now correctly formatted
              guest_name: guestName,
              reservation_uid: uid,
              source: bookingSource,
              status: status,
              notes: descriptionText,
            };

            if (existingReservationUids.has(uid)) {
              reservationsToInsert.push({ ...reservationData });
            } else {
              reservationsToInsert.push(reservationData);
            }
          } else {
            console.warn(`Skipping iCal event: Invalid or missing dtstart/dtend/uid type. UID: ${String(uid) || 'N/A'}`, {dtstart, dtend, uid});
          }
        }

    const { error: upsertError } = await supabase
      .from('reservations')
      .upsert(reservationsToInsert, { onConflict: 'reservation_uid' });

    if (upsertError) {
      console.error('Error upserting reservations:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save reservations: ' + upsertError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    }

    return new Response(
      JSON.stringify({
        message: 'iCal synced successfully',
        syncedReservations: reservationsToInsert.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );


  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('iCal sync API error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'iCal sync failed: ' + errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
