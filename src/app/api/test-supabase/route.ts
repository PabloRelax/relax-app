// src/app/api/test-supabase/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Await the result of the Supabase client
    const supabase = await createSupabaseServerClient();

    // Now you can call the 'from' method on the Supabase client
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);

    if (error) throw error;
    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
