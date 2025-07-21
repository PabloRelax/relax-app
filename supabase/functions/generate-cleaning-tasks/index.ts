import express, { Request, Response } from 'express';
import supabase from "@supabase/client";  // Adjust the path as necessary
import { getBrisbaneToday } from "@utils/dates";  // Adjust path as needed

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Define types for better type safety
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

// Define the POST endpoint to generate cleaning tasks
app.post('/generate-cleaning-tasks', async (_req: Request, res: Response) => {
  try {
    const todayBrisbane = getBrisbaneToday();  // Get today's date in Brisbane
    
    // Use the imported supabase client to interact with Supabase
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, end_date, property_id, platform_user_id, status, reservation_uid, start_date')
      .gte('end_date', todayBrisbane)  // Get reservations ending today or later
      .eq('status', 'confirmed');  // Only confirmed reservations
    
    // Check for errors or empty reservations
    if (reservationsError || !reservations) {
      throw new Error('Failed to fetch reservations');
    }

    // Continue with the logic of processing reservations...
    const tasksToUpsert: DbCleaningTask[] = [];

    for (const reservation of reservations) {
      const scheduledDateForTask = reservation.end_date;
      
      // Check if a task already exists for the reservation
      const { data: existingTask, error: existingTaskError } = await supabase
        .from('cleaning_tasks')
        .select('id, status, task_type_id')
        .eq('reservation_id', reservation.id)
        .eq('scheduled_date', scheduledDateForTask)
        .single();

      if (existingTaskError) {
        console.warn(`Error checking existing task for reservation ${reservation.id}:`, existingTaskError.message);
      }

      // Skip if the task is already marked as completed
      if (existingTask?.status === 'Completed') {
        console.log(`Skipping task for reservation ${reservation.id} - already completed`);
        continue;
      }

      // Create the cleaning task for the checkout date
      tasksToUpsert.push({
        reservation_id: reservation.id,
        property_id: reservation.property_id,
        platform_user_id: reservation.platform_user_id,
        task_category: 'Clean',
        task_type_id: 'clean',  // You should define this task type elsewhere
        priority_tag: 'Departure Clean',  // Define your logic for priority tag
        scheduled_date: scheduledDateForTask,
        status: 'Unassigned',
        notes: `Auto-generated cleaning task for reservation ${reservation.reservation_uid}`,
      });
    }

    // Upsert the tasks to Supabase
    if (tasksToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('cleaning_tasks')
        .upsert(tasksToUpsert, {
          onConflict: 'reservation_id,scheduled_date',  // Correctly pass a comma-separated string
          ignoreDuplicates: true,
        });

      if (upsertError) {
        console.error('Error upserting cleaning tasks:', upsertError.message);
        return res.status(500).json({ error: 'Failed to upsert cleaning tasks' });
      }

      res.json({ message: `${tasksToUpsert.length} cleaning tasks generated successfully` });
    } else {
      res.json({ message: 'No cleaning tasks generated. No relevant reservations found.' });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
