'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Import useRouter for redirection
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs' // Recommended Supabase client for client components

// Initialize Supabase client for client-side operations
// Use createClientComponentClient for better integration with Next.js App Router
const supabase = createClientComponentClient()

export default function Home() {
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  } | null>(null);
  const [loading, setLoading] = useState(true)
  const router = useRouter() // Initialize the router for navigation

  useEffect(() => {
    async function checkUserSession() {
      // Fetch the current user session
      const { data } = await supabase.auth.getUser()

      setUser(data.user) // Set the user state based on the fetched data
      setLoading(false) // Stop loading once user check is complete

      // If a user is found, redirect them to the multiview
      if (data.user) {
        router.push('/multiview')
      }
    }

    checkUserSession() // Run the user check when the component mounts

    // Set up a listener for authentication state changes
    // This handles real-time login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        router.push('/dashboard');
      } else {
        setUser(null);
      }
    });

    // Clean up the subscription when the component unmounts
    return () => {
      subscription?.unsubscribe();
    };

  }, [router]); // Add router to the dependency array

  // If still loading or user is already detected and being redirected, show loading message
  if (loading || user) {
    return <p className="p-8">Loading or redirecting...</p>
  }

  // Handle sending the magic link email
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // This is the URL that Supabase will redirect to after the user clicks the magic link
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    })
    if (error) {
      alert('Error sending magic link: ' + error.message) // Display the actual error message
    } else {
      alert('Magic link sent! Check your email. You will be redirected automatically once logged in.')
    }
  }

  // The logout button is removed from the homepage because logged-in users are redirected
  // Sign-out functionality will be available on the dashboard page instead.

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">Relax! We Clean – Login</h1>

      {/* This login form will only be visible if no user is currently logged in */}
      <div className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 p-2 rounded"
        />
        <button 
          type="button"
          onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
          Send Magic Link
        </button>
      </div>
    </main>
  )
}