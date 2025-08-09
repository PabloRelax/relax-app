// src\app\reset-password\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/lib/supabase/client'; // adjust this import if needed

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('access_token');
    if (token) {
      supabase.auth
        .exchangeCodeForSession(token)
        .then(({ data, error }) => {
          if (error || !data.session) {
            setError('Invalid or expired token');
          }
        });
    }
  }, [searchParams]);

  const handleUpdate = async () => {
    setStatus('loading');
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setStatus('error');
      setError(error.message);
    } else {
      setStatus('success');
      setTimeout(() => router.push('/login'), 2000);
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
          />
          <button
            onClick={handleUpdate}
            disabled={status === 'loading'}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {status === 'loading' ? 'Updating...' : 'Update Password'}
          </button>

          {status === 'error' && <p className="text-red-600 mt-2">{error}</p>}
        </>
      )}
    </div>
  );
}
