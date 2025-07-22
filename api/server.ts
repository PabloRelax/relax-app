import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { getBrisbaneToday } from '@utils/dates';

const app = express();
app.use(express.json());

// Initialise Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'healthy',
    date: getBrisbaneToday(),
  });
});

app.post('/generate-cleaning-tasks', async (_, res) => {
  try {
    const today = getBrisbaneToday();
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        end_date,
        property:property_id (id, name, cleaning_instructions),
        guest:platform_user_id (id, name),
        status
      `)
      .gte('end_date', today)
      .eq('status', 'confirmed');

    if (error) throw error;

    res.json({
      status: 'success',
      count: data?.length ?? 0,
      data,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Export Express handler
export default app;
