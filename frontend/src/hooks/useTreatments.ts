import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Treatment {
  id: number;
  name: string;
  description?: string;
  video_link?: string;
}

export function useTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('📋 Fetching treatments...');
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Starting treatments fetch...');
      
      // Add timeout to prevent infinite loading
      const fetchPromise = supabase
        .from('treatments')
        .select('*')
        .order('name', { ascending: true });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout - treatments table may not exist')), 10000)
      );

      const { data, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      console.log('📊 Treatments fetch result:', { data, error: fetchError });

      if (fetchError) {
        console.error('❌ Error fetching treatments:', fetchError);
        
        // Check if it's a table doesn't exist error
        if (fetchError.message?.includes('relation "treatments" does not exist') || 
            fetchError.message?.includes('table') || 
            fetchError.code === 'PGRST116') {
          setError('Treatments table not set up. Please run the SQL setup script.');
        } else {
          setError(fetchError.message);
        }
        setTreatments([]);
        return;
      }

      console.log('✅ Fetched treatments:', data);
      setTreatments(data || []);
    } catch (err) {
      console.error('❌ Error in fetchTreatments:', err);
      
      if (err instanceof Error && err.message.includes('timeout')) {
        setError('Database connection timeout. Tables may not exist. Please run the SQL setup script.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch treatments');
      }
      setTreatments([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    treatments,
    loading,
    error,
    refetch: fetchTreatments
  };
} 