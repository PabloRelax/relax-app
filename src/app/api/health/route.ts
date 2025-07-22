// File: src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getBrisbaneToday } from '../../../../supabase/functions/utils/dates';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    date: getBrisbaneToday(),
  });
}