// app/debug/page.tsx
'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase/client';
import type { Session, AuthError, User } from '@supabase/supabase-js';

export default function DebugPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [storageToken, setStorageToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [error, setError] = useState<AuthError | null>(null);

  // Get project reference from URL
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = projectUrl?.replace('https://', '').split('.')[0];
  const storageKey = projectRef ? `sb-${projectRef}-auth-token` : null;

  type AuthEvent = {
    timestamp: string;
    event: string;
    session: 'exists' | 'none';
    user: string | null;
  };
  const [authEvents, setAuthEvents] = useState<AuthEvent[]>([]);

  type MultiviewEvent = {
    timestamp: string;
    type: string;
    data?: unknown;
  };
  const [multiViewEvents, setMultiViewEvents] = useState<MultiviewEvent[]>([]);

  // Listen for auth changes and fetch initial session
  useEffect(() => {
    if (!supabase?.auth) {
      console.error("❌ supabase.auth is undefined");
      return;
    }

    // 1. Setup auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
      const newEvent: AuthEvent = {
        timestamp: new Date().toISOString(),
        event,
        session: session ? 'exists' : 'none',
        user: session?.user?.email || null
      };
      setAuthEvents(prev => [newEvent, ...prev].slice(0, 20));
        console.log('Auth Event:', newEvent);
      }
    );

    // 2. Check current session
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log('Session Check:', { data, error });
      setSession(data.session);
      setUser(data.session?.user || null);
      setError(error);
    };

    // 3. Check localStorage tokens
    const checkTokens = () => {
      if (storageKey && typeof window !== 'undefined') {
        const rawToken = localStorage.getItem(storageKey);
        if (rawToken) {
          try {
            const parsed = JSON.parse(rawToken);
            setStorageToken(parsed.access_token || null);
            setRefreshToken(parsed.refresh_token || null);
          } catch (e) {
            console.error('Token parse error:', e);
          }
        }
      }
    };

    checkSession();
    checkTokens();

    // 4. Listen for messages from MultiView page
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'MULTIVIEW_EVENT') {
        setMultiViewEvents(prev => [event.data.payload, ...prev].slice(0, 20));
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, [storageKey]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🔍 Supabase Debug Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-3">Session Information</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Status:</strong> {session ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
            <div><strong>User:</strong> {user ? user.email : 'None'}</div>
            <div><strong>User ID:</strong> {user?.id || 'None'}</div>
            <div>
              <strong>Access Token:</strong> 
              <div className="truncate text-xs mt-1 p-1 bg-gray-100 rounded">
                {storageToken || 'None found'}
              </div>
            </div>
            <div>
              <strong>Refresh Token:</strong> 
              <div className="truncate text-xs mt-1 p-1 bg-gray-100 rounded">
                {refreshToken || 'None found'}
              </div>
            </div>
            {error && (
              <div className="text-red-600">
                <strong>Error:</strong> {error.message}
              </div>
            )}
          </div>
        </div>

        {/* Auth Events */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-3">Auth Events</h2>
          <div className="h-64 overflow-y-auto text-sm space-y-1">
            {authEvents.length > 0 ? (
              authEvents.map((event, i) => (
                <div key={i} className="p-2 border-b">
                  <div className="font-mono text-xs text-gray-500">
                    [{event.timestamp.split('T')[1].split('.')[0]}]
                  </div>
                  <div>
                    <span className="font-medium">{event.event}</span> - 
                    User: {event.user || 'none'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No auth events recorded</div>
            )}
          </div>
        </div>

        {/* MultiView Events */}
        <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
          <h2 className="font-semibold text-lg mb-3">MultiView Events</h2>
          <div className="h-48 overflow-y-auto text-sm space-y-1">
            {multiViewEvents.length > 0 ? (
              multiViewEvents.map((event, i) => (
                <div key={i} className="p-2 border-b">
                  <div className="font-mono text-xs text-gray-500">
                    [{event.timestamp.split('T')[1].split('.')[0]}]
                  </div>
                  <div>
                    <span className="font-medium">{event.type}</span>
                    {typeof event.data === 'object' && event.data !== null && (
                      <div className="text-xs mt-1 text-gray-600">
                        {JSON.stringify(event.data)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">
                No events from MultiView page. Make sure to add the event logger.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold text-lg mb-3">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign In
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
          <button
            onClick={() => {
              if (storageKey) {
                localStorage.removeItem(storageKey);
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Clear Tokens
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Refresh Page
          </button>
        </div>
      </div>

      {/* Technical Details */}
      <details className="bg-white p-4 rounded-lg shadow">
        <summary className="cursor-pointer font-semibold text-lg">
          Technical Details
        </summary>
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
          </div>
          <div>
            <strong>Storage Key:</strong> {storageKey || 'Not configured'}
          </div>
          <div>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </div>
            <div>
              <strong>Current Path:</strong> 
              {typeof window !== 'undefined' ? window.location.pathname : 'Not available during SSR'}
          </div>
        </div>
      </details>
    </div>
  );
}