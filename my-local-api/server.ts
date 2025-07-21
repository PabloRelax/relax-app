// server.ts - Production-ready Express API with Supabase
import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { getBrisbaneToday } from '../supabase/functions/utils/dates';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface Property {
  id: string;
  name: string;
  cleaning_instructions?: string;
}

interface Guest {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  end_date: string;
  property: Property;
  guest: Guest;
  status: string;
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase (server-side optimized)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const app = express();
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check with system info
app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'healthy',
    supabase: {
      connected: !!supabaseUrl,
      url: supabaseUrl?.replace(/\.co.*$/, '.co') // Partial URL for security
    },
    timezone: 'Australia/Brisbane',
    currentDate: getBrisbaneToday()
  });
});

// Main endpoint with improved error handling
app.post('/generate-cleaning-tasks', async (req, res) => {
  try {
    console.log('Starting task generation...'); // Debug log
    const today = getBrisbaneToday();
    console.log('Today:', today); // Debug log

    // 1. Fetch reservations
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        end_date,
        property:property_id (id, name, cleaning_instructions),
        guest:platform_user_id (id, name),
        status
      `)
      .gte('end_date', today)
      .eq('status', 'confirmed')
      .returns<Reservation[]>();

    console.log('Reservations found:', reservations?.length); // Debug log

    if (fetchError) {
      console.error('Fetch Error:', fetchError); // Debug log
      throw fetchError;
    }
    
    if (!reservations?.length) {
      console.log('No reservations found for today'); // Debug log
      return res.json({ 
        status: 'success',
        message: 'No reservations requiring cleaning today',
        data: []
      });
    }

    // Rest of your code...

  } catch (error) {
    console.error('Full Error:', error); // More detailed logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate tasks',
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
});

// Centralized error handling
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Server startup
const PORT = process.env.PORT || 3001; // Different from Next.js port
app.listen(PORT, () => {
  console.log(`
  🚀 Cleaning Tasks API Started
  ----------------------------------
  ➡️ Local:    http://localhost:${PORT}
  ➡️ Health:   http://localhost:${PORT}/health
  ➡️ Timezone: Australia/Brisbane (${getBrisbaneToday()})
  ➡️ Supabase: Connected to ${supabaseUrl?.replace(/\.co.*$/, '.co')}
  `);
});