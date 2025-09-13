import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export interface Session {
  id: number;
  created_at: string;
  patient_id: string;
  doctor_id?: string;
  status: 'pending' | 'active' | 'rejective' | 'completed';
  due_date?: string;
  ai_evaluation?: any; // JSONB
  exercise_sets?: number;
  exercise_reps?: number;
  exercise_weight?: number;
  exercise_duration_in_weeks?: number;
  exercise_frequency_daily?: number;
  treatment_id?: number;
  previdurl?: string; // Original video URL in Supabase
  pose_video_id?: string; // UUID
  patient_notes?: string;
  postvidurl?: string; // Processed video URL in Supabase
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

      console.log('🔄 Starting session fetch via API...');
      
      const response = await fetch(`/api/sessions?userId=${user?.id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sessions');
      }

      const result = await response.json();
      
      console.log('📊 Session fetch result:', result);

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      console.log('✅ Fetched sessions via API:', result.data);
      setSessions(result.data || []);
    } catch (err) {
      console.error('❌ Error in fetchSessions:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('fetch')) {
          setError('Network error. Please check your connection and try again.');
        } else if (err.message.includes('table') || err.message.includes('relation')) {
          setError('Database tables not set up. Please run the SQL setup script.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to fetch sessions');
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (treatmentId: number, additionalData?: Partial<Session>) => {
    try {
      console.log('📝 Creating session via API...');
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: user?.id,
          treatment_id: treatmentId,
          ...additionalData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      console.log('✅ Created session via API:', result.data);
      setSessions(prev => [result.data, ...prev]);
      return result.data;
    } catch (err) {
      console.error('❌ Error in createSession:', err);
      throw err;
    }
  };

  const updateSession = async (sessionId: number, updates: Partial<Session>) => {
    try {
      console.log('📝 Updating session via API...');
      
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update session');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      console.log('✅ Updated session via API:', result.data);
      setSessions(prev => prev.map(s => s.id === sessionId ? result.data : s));
      return result.data;
    } catch (err) {
      console.error('❌ Error in updateSession:', err);
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