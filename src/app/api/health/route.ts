// File: src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBrisbaneToday } from '../../../../supabase/functions/utils/dates';

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    date: getBrisbaneToday(),
  });
}
