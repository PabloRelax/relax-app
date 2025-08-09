// src/app/api/generate-cleaning-tasks/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBrisbaneToday } from 'supabase/functions/utils/dates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  console.log('🚀 [generate-cleaning-tasks] POST called');
  try {
    const { property_id } = await req.json();
    if (!property_id) {
      return NextResponse.json({ error: 'Missing property_id' }, { status: 400 });
    }
    const todayBrisbane = getBrisbaneToday();

    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, end_date, property_id, platform_user_id, status, reservation_uid, start_date')
      .gte('end_date', todayBrisbane)
      .eq('status', 'confirmed')
      .eq('property_id', property_id);
    
      if (reservationsError) {
      console.error('❌ Error fetching reservations:', reservationsError.message);
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }
    console.log(`📅 Fetched ${reservations?.length ?? 0} reservations`);

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({ message: 'No relevant reservations found' });
    }

    const tasksToUpsert = [];

    // Get task_type_id for 'Clean' for this platform_user_id
    const { data: taskTypeRow, error: taskTypeError } = await supabase
      .from('task_types')
      .select('id')
      .eq('name', 'Clean')
      .eq('platform_user_id', reservations[0]?.platform_user_id)
      .maybeSingle();

    if (taskTypeError || !taskTypeRow) {
      console.error('❌ Failed to fetch task_type_id for Clean:', taskTypeError?.message);
      return NextResponse.json({ error: 'Missing task_type_id for Clean' }, { status: 500 });
    }

    const taskTypeId = taskTypeRow.id;

    for (const reservation of reservations) {
      const scheduledDate = reservation.end_date;

      // Check for B2B scenario
      const { data: nextReservation, error: nextResError } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', reservation.property_id)
        .eq('start_date', scheduledDate)
        .neq('id', reservation.id)
        .maybeSingle();

      const priorityTag = nextReservation && !nextResError ? 'B2B' : 'Departure Clean';
      
      const { data: existingTask, error: existingError } = await supabase
        .from('cleaning_tasks')
        .select('id, status')
        .eq('reservation_id', reservation.id)
        .eq('task_type_id', taskTypeId)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      if (existingError) {
        console.warn(`⚠️ Error checking existing task for reservation ${reservation.id}:`, existingError.message);
      }

      if (existingTask?.status === 'Completed') {
        console.log(`✅ Skipping reservation ${reservation.id} (already completed)`);
        continue;
      }

      tasksToUpsert.push({
        property_id: reservation.property_id,
        reservation_id: reservation.id,
        platform_user_id: reservation.platform_user_id,
        task_category: 'Clean',
        task_type_id: taskTypeId,
        priority_tag: priorityTag,
        scheduled_date: scheduledDate,
        status: 'Unassigned',
        notes: `Auto-generated ${priorityTag.toLowerCase()} for reservation ${reservation.reservation_uid}`,
      });
    }

    if (tasksToUpsert.length === 0) {
      return NextResponse.json({ message: 'No tasks to generate' });
    }

    const { error: upsertError } = await supabase
      .from('cleaning_tasks')
      .upsert(tasksToUpsert, {
        onConflict: 'reservation_id,task_type_id,scheduled_date',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('❌ Error upserting cleaning tasks:', upsertError.message);
      console.dir(tasksToUpsert, { depth: null });
      return NextResponse.json({ error: 'Failed to upsert tasks', detail: upsertError.message }, { status: 500 });
    }

    console.log(`✅ Successfully upserted ${tasksToUpsert.length} tasks`);

    return NextResponse.json({ message: `Generated/updated ${tasksToUpsert.length} cleaning tasks.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Unexpected error in route.ts:', message);
    return NextResponse.json({ error: 'Unexpected error', detail: message }, { status: 500 });
  }
}
