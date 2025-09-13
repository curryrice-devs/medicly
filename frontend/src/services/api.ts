import { PatientCase, CaseStats, Exercise } from '@/types/medical.types';
import { supabaseBrowser } from '@/lib/supabase/client';

export const doctorApi = {
  async listCases(filters: any): Promise<{ items: PatientCase[], total: number, stats: CaseStats }> {
    const {
      status = 'pending',
      sort = 'submittedAt:desc',
      search = '',
      page = 1,
      perPage = 20,
    } = filters || {};

    const supabase = supabaseBrowser();

    // Fetch sessions (no RLS filtering yet); optionally filter client-side
    console.log('[doctorApi.listCases] fetching sessions via /api/doctor/sessions')
    let sessions: any[] | null = null
    let treatmentsById: Record<number, { id: number; video_link: string | null; description: string | null }> = {}
    try {
      const resp = await fetch('/api/doctor/sessions', { cache: 'no-store' })
      const payload = await resp.json().catch(() => ({ error: 'invalid json' }))
      if (!resp.ok) {
        console.warn('[doctorApi.listCases] route error payload', payload)
        throw new Error(`HTTP ${resp.status}`)
      }
      sessions = payload.sessions
      treatmentsById = payload.treatmentsById || {}
    } catch (e) {
      console.warn('[doctorApi.listCases] /api/doctor/sessions error', e)
      return { items: [], total: 0, stats: { pendingCount: 0, completedToday: 0, averageReviewTimeSec: 0 } }
    }

    if (!sessions) {
      console.warn('[doctorApi.listCases] no sessions from API')
      return { items: [], total: 0, stats: { pendingCount: 0, completedToday: 0, averageReviewTimeSec: 0 } }
    }
    console.log('[doctorApi.listCases] sessions fetched', { count: sessions.length })

    // treatmentsById already supplied by route

    // Map DB rows -> PatientCase
    let mapped: PatientCase[] = sessions.map((s) => {
      const treatment = s.treatment_id ? treatmentsById[s.treatment_id] : undefined;
      const recommendedExercise: Exercise = {
        id: `T-${treatment?.id ?? 'none'}`,
        name: treatment?.description || 'Recommended Exercise',
        description: treatment?.description || 'Automatically recommended exercise',
        bodyPart: '',
        injuryTypes: [],
        defaultSets: s.exercise_sets ?? 3,
        defaultReps: s.exercise_reps ?? 8,
        defaultFrequency: 'Daily',
        videoUrl: treatment?.video_link || undefined,
      };

      // Derive urgency from due date proximity
      const due = s.due_date ? new Date(s.due_date) : null;
      const daysUntilDue = due ? Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
      const urgency: PatientCase['urgency'] = daysUntilDue !== null
        ? (daysUntilDue <= 2 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low')
        : 'medium';

      const pc: PatientCase = {
        id: String(s.id),
        patientId: s.patient_id ?? 'unknown',
        videoUrl: treatment?.video_link || '',
        injuryType: 'General',
        aiAnalysis: s.ai_evaluation || 'Awaiting AI evaluation',
        recommendedExercise,
        status: (String(s.status).toLowerCase() as any) || 'pending',
        submittedAt: s.created_at,
        urgency,
        aiConfidence: 0.8,
      };
      return pc;
    });

    // Search filter (client-side simple)
    if (search) {
      const q = String(search).toLowerCase();
      mapped = mapped.filter((c) => `${c.id} ${c.patientId}`.toLowerCase().includes(q));
    }
    // Status filter (server did not filter by status to keep code simple)
    if (status) {
      mapped = mapped.filter((c) => c.status === status);
    }

    // Sort
    const [sortKey, sortDir] = String(sort).split(':');
    mapped = mapped.slice().sort((a, b) => {
      if (sortKey === 'submittedAt') {
        const av = new Date(a.submittedAt).getTime();
        const bv = new Date(b.submittedAt).getTime();
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      if (sortKey === 'urgency') {
        const order = { high: 3, medium: 2, low: 1 } as const;
        const av = order[a.urgency] || 0;
        const bv = order[b.urgency] || 0;
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });

    // Pagination
    const total = mapped.length;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const items = mapped.slice(start, end);

    // Stats
    const pendingCount = mapped.filter((c) => c.status === 'pending').length;
    const today = new Date();
    const isSameDay = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate();
    };
    const completedToday = mapped.filter(
      (c) => (c.status === 'approved' || c.status === 'modified') && isSameDay(c.submittedAt)
    ).length;
    const averageReviewTimeSec = 18 * 60;

    return { items, total, stats: { pendingCount, completedToday, averageReviewTimeSec } };
  },

  async getCaseById(id: string): Promise<PatientCase | null> {
    console.log('[doctorApi.getCaseById] fetching session via /api/doctor/sessions for id:', id)

    try {
      const resp = await fetch('/api/doctor/sessions', { cache: 'no-store' })
      const payload = await resp.json().catch(() => ({ error: 'invalid json' }))
      if (!resp.ok) {
        console.warn('[doctorApi.getCaseById] route error payload', payload)
        return null
      }

      const sessions = payload.sessions || []
      const treatmentsById = payload.treatmentsById || {}

      // Find the specific session by ID
      const s = sessions.find((session: any) => String(session.id) === String(id))
      if (!s) {
        console.warn('[doctorApi.getCaseById] session not found for id:', id)
        return null
      }

      const treatment = s.treatment_id ? treatmentsById[s.treatment_id] : undefined;
      const recommendedExercise: Exercise = {
        id: `T-${treatment?.id ?? 'none'}`,
        name: treatment?.description || 'Recommended Exercise',
        description: treatment?.description || 'Automatically recommended exercise',
        bodyPart: '',
        injuryTypes: [],
        defaultSets: s.exercise_sets ?? 3,
        defaultReps: s.exercise_reps ?? 8,
        defaultFrequency: 'Daily',
        videoUrl: treatment?.video_link || undefined,
      };

      const due = s.due_date ? new Date(s.due_date) : null;
      const daysUntilDue = due ? Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
      const urgency: PatientCase['urgency'] = daysUntilDue !== null
        ? (daysUntilDue <= 2 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low')
        : 'medium';

      const pc: PatientCase = {
        id: String(s.id),
        patientId: s.patient_id ?? 'unknown',
        videoUrl: treatment?.video_link || '',
        injuryType: 'General',
        aiAnalysis: s.ai_evaluation || 'Awaiting AI evaluation',
        recommendedExercise,
        status: (String(s.status).toLowerCase() as any) || 'pending',
        submittedAt: s.created_at,
        urgency,
        aiConfidence: 0.8,
      };

      return pc;
    } catch (e) {
      console.error('[doctorApi.getCaseById] error:', e)
      return null
    }
  },

  async searchExercises(query: any): Promise<{ items: Exercise[], total: number }> {
    return {
      items: [],
      total: 0
    };
  },

  async getPatientProfile(patientId: string): Promise<any> {
    console.log('[doctorApi.getPatientProfile] fetching profile via API route for patientId:', patientId);
    try {
      const resp = await fetch(`/api/doctor/patient-profile/${patientId}`, { cache: 'no-store' })
      const payload = await resp.json().catch(() => ({ error: 'invalid json' }))

      if (!resp.ok) {
        console.warn('[doctorApi.getPatientProfile] route error payload', payload)
        return null
      }

      console.log('[doctorApi.getPatientProfile] found profile:', payload.profile);
      return payload.profile;
    } catch (e) {
      console.error('[doctorApi.getPatientProfile] unexpected error:', e);
      return null;
    }
  }
}; 