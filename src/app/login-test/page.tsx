//C:\Users\Pablo\relax-app\src\app\login-test\page.tsx
'use client';

import { useState } from 'react';
import supabase from '@/lib/supabase/client';

export default function LoginTestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage('✅ Magic link sent! Check your email.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow space-y-4">
      <h1 className="text-xl font-bold">🔐 Login Test Page</h1>

      <input
        type="email"
        className="border px-3 py-2 rounded w-full"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
