// app/api/test-supabase/route.ts
import supabaseServer from '@/lib/supabase/server'

export async function GET() {
  try {
    // Use the client directly (no function call needed)
    const { data, error } = await supabaseServer
      .from('reservations')
      .select('*')
      .limit(1)

    if (error) throw error
    return Response.json({ success: true, data })
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}