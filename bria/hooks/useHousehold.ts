import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { HouseholdProfile } from '@/lib/database.types';

/**
 * Returns the current household's profile.
 * Used to determine Cleaner vs DIY mode and seed Bria's context.
 */
export function useHousehold() {
  const [profile, setProfile]   = useState<HouseholdProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data, error } = await supabase
      .from('household_profiles')
      .select('*')
      .single();

    if (error) setError(error.message);
    else setProfile(data);
    setLoading(false);
  }

  return { profile, loading, error, refetch: fetchProfile };
}
