// supabase/functions/generate-cleaning-tasks/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { getBrisbaneToday } from "../utils/dates.ts";

// Define types for better type safety in Deno
type DbReservation = {
  id: number;
  end_date: string; // YYYY-MM-DD
  start_date: string; // YYYY-MM-DD
  property_id: number;
  platform_user_id: string; // uuid
  status: string;
  reservation_uid: string;
};

type DbCleaningTask = {
  id?: number; // Optional as it's auto-generated
  reservation_id: number | null;
  property_id: number;
  platform_user_id: string;
  task_category: string;
  task_type_id: string;
  priority_tag: string;
  scheduled_date: string; // YYYY-MM-DD
  status: string;
  notes: string;
  assigned_cleaner_names?: string | null;
  assigned_coordinator_name?: string | null;
  issue_status?: string | null;
  issue_category?: string | null;
  created_at?: string; // Optional, auto-generated
  updated_at?: string; // Optional, auto-updated
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // 1. Obtener la fecha actual en Brisbane (UTC+10)
    const todayBrisbane = getBrisbaneToday();

    // 2. Buscar reservas que terminan hoy o después (en tiempo Brisbane)
    const { data: reservations, error: reservationsError } = await supabaseClient
      .from('reservations')
      .select<string, DbReservation>('id, end_date, property_id, platform_user_id, status, reservation_uid, start_date')
      .gte('end_date', todayBrisbane) // Usamos la fecha de Brisbane
      .eq('status', 'confirmed');

    // 🔍 Fetch task_types from the database
    const { data: taskTypes, error: taskTypesError } = await supabaseClient
      .from('task_types')
      .select('id, name');

    if (taskTypesError || !taskTypes) {
      console.error('Error fetching task types:', taskTypesError?.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch task types' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      });
    }

    // ✅ Find task_type_id for "Clean"
    const cleanTaskType = taskTypes.find(t => t.name === 'Clean');
    if (!cleanTaskType) {
      console.error('Could not find task_type "Clean"');
      return new Response(JSON.stringify({ error: 'Missing required task_type: Clean' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      });
    }

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch reservations' }), {
        status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          }
      });
    }

    if (!reservations || reservations.length === 0) {
      return new Response(JSON.stringify({ message: 'No relevant confirmed reservations found ending today or in the future.' }), { // Mensaje actualizado
        status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          }
      });
    }

    const tasksToUpsert: DbCleaningTask[] = [];

    // No need to fetch uniqueTaskKeys explicitly, upsert handles it
    // The check for existing tasks before upsert is less critical now due to onConflict


    for (const reservation of reservations) {
      // 3. La fecha programada para la tarea es la fecha de checkout de la reserva
      const scheduledDateForTask = reservation.end_date;

      // 4. Verificar reservas B2B (usando fecha de la tarea)
      const { data: nextReservation, error: nextReservationError } = await supabaseClient
        .from('reservations')
        .select('id')
        .eq('property_id', reservation.property_id)
        .eq('start_date', scheduledDateForTask) // Otra reserva comienza cuando esta termina
        .neq('id', reservation.id) // Asegurarse de que no sea la misma reserva
        .single();

      const priorityTag = nextReservation && !nextReservationError ? 'B2B' : 'Departure Clean';
            
      // 4. Check if a task already exists and is marked as Completed
      const { data: existingTask, error: existingTaskError } = await supabaseClient
        .from('cleaning_tasks')
        .select('id, status, task_type_id')
        .eq('reservation_id', reservation.id)
        .eq('task_type_id', cleanTaskType.id)
        .eq('scheduled_date', scheduledDateForTask)
        .maybeSingle();

      if (existingTaskError) {
        console.warn(`Error checking existing task for reservation ${reservation.id}:`, existingTaskError.message);
      }

      // Skip updating if it's marked as Completed
      if (existingTask?.status === 'Completed') {
        console.log(`Skipping task for reservation ${reservation.id} - already marked as Completed`);
        continue;
      }       
      
      // 5. Crear tarea para el día de checkout (sin agregar días)
      tasksToUpsert.push({
        property_id: reservation.property_id,
        reservation_id: reservation.id,
        platform_user_id: reservation.platform_user_id,
        task_category: 'Clean',
        task_type_id: cleanTaskType.id,
        priority_tag: priorityTag,
        scheduled_date: scheduledDateForTask, // Usamos la fecha de checkout directamente
        status: 'Unassigned',
        notes: `Auto-generated ${priorityTag.toLowerCase()} for reservation ${reservation.reservation_uid}`,
      });
    }

    if (tasksToUpsert.length === 0) {
      return new Response(JSON.stringify({ message: 'No new tasks to generate or update for today onwards.' }), { status: 200, headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          }
      });
    }

    // 6. Insertar/Actualizar tareas en lote
    const { error: upsertError } = await supabaseClient
      .from('cleaning_tasks')
      .upsert(tasksToUpsert as DbCleaningTask[], {
        onConflict: 'reservation_id,task_type_id,scheduled_date',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Error upserting cleaning tasks:', upsertError.message);
      return new Response(JSON.stringify({ error: 'Failed to upsert cleaning tasks: ' + upsertError.message }), { status: 500, headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          }
      });
    }

    return new Response(JSON.stringify({ message: `Successfully generated/updated ${tasksToUpsert.length} cleaning tasks.` }), { status: 200, headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          } 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge Function error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred: ' + errorMessage }),
      { status: 500, headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          } 
      }
    );
  }
});