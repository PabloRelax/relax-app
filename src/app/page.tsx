// C:\Users\Pablo\relax-app\src\app\page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Import useRouter for redirection
import supabase from '@/lib/supabase/client';

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
  const [resetSent, setResetSent] = useState(false);


  useEffect(() => {
    async function checkUserSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        const { data } = await supabase
          .from('users_view') // or your role table
          .select('role_name')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const role = data?.role_name;

        if (role === 'cleaner') {
          router.push('/cleaner/home');
        } else {
          router.push('/operations');
        }
      }
    }

    checkUserSession() // Run the user check when the component mounts

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        const checkAndRedirect = async () => {
          const { data } = await supabase
            .from('users_view')
            .select('role_name')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const role = data?.role_name;

          if (role === 'cleaner') {
            router.push('/cleaner/home');
          } else {
            router.push('/operations');
          }
        };
        checkAndRedirect();
      } else {
        setUser(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
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
        emailRedirectTo: '${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback',
      },
    });

    if (error) {
      alert('Error sending magic link: ' + error.message);
    } else {
      alert('Magic link sent! Check your email.');
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      alert('Please enter your email first.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) {
      alert('Error sending reset email: ' + error.message);
    } else {
      setResetSent(true);
    }
  };

  // ✅ Now the main return block (the JSX part)
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">Relax! We Clean – Login</h1>
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
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send Magic Link
        </button>
        <button
          type="button"
          onClick={handlePasswordReset}
          className="text-sm text-blue-600 underline hover:text-blue-800"
        >
          Forgot your password?
        </button>

        {resetSent && (
          <p className="text-green-600 text-sm mt-2">Reset link sent. Check your email.</p>
        )}
      </div>
    </main>
  );
}