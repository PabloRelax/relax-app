// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

// Create and export the client instance directly
const supabaseServerClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default supabaseServerClient