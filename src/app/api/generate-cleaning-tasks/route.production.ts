// src/app/api/generate-cleaning-tasks/route.production.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { property_id } = await request.json();

    if (!property_id) {
      return NextResponse.json(
        { error: 'Missing property_id' },
        { status: 400 }
      );
    }

    // ✅ Llamar a la función Edge de Supabase de forma segura desde el backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-cleaning-tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, // 👈 nunca llega al frontend
        },
        body: JSON.stringify({ property_id }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from Edge Function:', errorData);
      return NextResponse.json(
        { error: 'Task generation failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Internal error in generate-cleaning-tasks route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
