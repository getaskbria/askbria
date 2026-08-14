import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Returns the current Supabase session and a loading flag.
 * Use this to gate auth vs app screens.
 */
export function useSession() {
  const [session, setSession]   = useState<Session | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}
