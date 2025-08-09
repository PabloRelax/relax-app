// src/app/api/invite/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, role_type_id, platform_user_id } = body;

    if (!email || !role_type_id || !platform_user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Invite the user
    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError || !data?.user) {
      return NextResponse.json({ error: inviteError?.message || 'Invite failed' }, { status: 500 });
    }

    // Assign role
    const { error: insertError } = await supabaseAdmin.from('user_roles').insert({
      user_id: data.user.id,
      role_type_id,
      platform_user_id,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User invited successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
