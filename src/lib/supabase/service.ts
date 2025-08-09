// src/lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from 'types/supabase';

export const supabaseService = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ⚠️ MUST be service_role key
);
