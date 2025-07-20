'use client';

import { useEffect } from 'react';
import supabase from '@/lib/supabase/client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🧪 onAuthStateChange event:', event);
      if (event === 'SIGNED_IN') {
        console.log('✅ User signed in via magic link:', session?.user);
      }
    });

    // Also force a session sync on first load
    supabase.auth.getSession().then(({ data }) => {
      console.log('🧪 getSession on mount:', data?.session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
