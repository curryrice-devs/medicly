import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export interface Session {
  id: number;
  created_at: string;
  patient_id: string;
  video_id?: number;
  doctor_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'reviewed';
  due_date?: string;
  ai_evaluation?: string;
  exercise_sets?: number;
  exercise_reps?: number;
  exercise_weight?: number;
  exercise_duration_in_weeks?: number;
  exercise_frequency_daily?: number;
  treatment_id?: number;
  treatment?: Treatment;
}

export interface Treatment {
  id: number;
  name: string;
  description?: string;
  video_link?: string;
}

export function usePatientSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 usePatientSessions - user:', user);
    
    if (!user?.id) {
      console.log('⚠️ No user ID, skipping session fetch');
      setLoading(false);
      setSessions([]);
      return;
    }

    console.log('📋 Fetching sessions for user:', user.id);
    fetchSessions();
  }, [user?.id]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Starting session fetch...');
      
      // Add a timeout to prevent infinite loading
      const fetchPromise = supabase
        .from('sessions')
        .select(`
          *,
          treatment:treatments(*)
        `)
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout - tables may not exist')), 10000)
      );

      const { data, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      console.log('📊 Session fetch result:', { data, error: fetchError });

      if (fetchError) {
        console.error('❌ Error fetching sessions:', fetchError);
        
        // Check if it's a table doesn't exist error
        if (fetchError.message?.includes('relation "sessions" does not exist') || 
            fetchError.message?.includes('table') || 
            fetchError.code === 'PGRST116') {
          setError('Database tables not set up. Please run the SQL setup script.');
        } else {
          setError(fetchError.message);
        }
        setSessions([]);
        return;
      }

      console.log('✅ Fetched sessions:', data);
      setSessions(data || []);
    } catch (err) {
      console.error('❌ Error in fetchSessions:', err);
      
      if (err instanceof Error && err.message.includes('timeout')) {
        setError('Database connection timeout. Tables may not exist. Please run the SQL setup script.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (treatmentId: number, additionalData?: Partial<Session>) => {
    try {
      const { data, error: createError } = await supabase
        .from('sessions')
        .insert({
          patient_id: user?.id,
          treatment_id: treatmentId,
          status: 'pending',
          created_at: new Date().toISOString(),
          ...additionalData
        })
        .select(`
          *,
          treatment:treatments(*)
        `)
        .single();

      if (createError) {
        console.error('Error creating session:', createError);
        throw createError;
      }

      console.log('✅ Created session:', data);
      setSessions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error in createSession:', err);
      throw err;
    }
  };

  const updateSession = async (sessionId: number, updates: Partial<Session>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)
        .select(`
          *,
          treatment:treatments(*)
        `)
        .single();

      if (updateError) {
        console.error('Error updating session:', updateError);
        throw updateError;
      }

      console.log('✅ Updated session:', data);
      setSessions(prev => prev.map(s => s.id === sessionId ? data : s));
      return data;
    } catch (err) {
      console.error('Error in updateSession:', err);
      throw err;
    }
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
    updateSession
  };
} 