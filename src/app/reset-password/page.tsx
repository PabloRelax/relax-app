// src/app/reset-password/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    (async () => {
      try {
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error || !data.session) throw error || new Error('No session');
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error || !data.session) throw error || new Error('No session');
        }
      } catch (e) {
        console.error(e);
        setError('Invalid or expired link. Please request a new reset email.');
      }
    })();
  }, [searchParams]);

  const handleUpdate = async () => {
    setStatus('loading');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus('error');
      setError(error.message);
    } else {
      setStatus('success');
      setTimeout(() => router.push('/login'), 1500);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Reset your password</h1>

      {status === 'success' ? (
        <p className="text-green-600">✅ Password updated. Redirecting...</p>
      ) : (
        <>
          <input
            type="password"
            className="border p-2 w-full rounded mb-3"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
          />
          <button
            onClick={handleUpdate}
            disabled={status === 'loading' || newPassword.length < 8}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {status === 'loading' ? 'Updating...' : 'Update Password'}
          </button>

          {status === 'error' && <p className="text-red-600 mt-2">{error}</p>}
        </>
      )}
    </div>
  );
}
