import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code') // Supabase sends the code here

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successfully authenticated. Redirect the user to your main app dashboard.
      // You can change '/dashboard' to '/' if you want them to land on the homepage.
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    }
  }

  // If there's no code or an error, redirect them back to the login page
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}