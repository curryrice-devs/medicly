import { PatientCase, CaseStats, Exercise } from '@/types/medical.types';
import { supabaseBrowser } from '@/lib/supabase/client';
import { parseAIAnalysis, createFallbackAnalysis, AIAnalysisData } from '@/types/ai-analysis.types';

// Helper function to create PatientCase from session data and AI analysis
function createPatientCaseFromSession(s: any, treatmentsById: any): PatientCase {
  // Parse AI analysis JSON or create fallback
  const aiAnalysis = parseAIAnalysis(s.ai_evaluation || '') || createFallbackAnalysis(s.ai_evaluation || 'Awaiting AI evaluation');

  const treatment = s.treatment_id ? treatmentsById[s.treatment_id] : undefined;

  // Create exercise info from database columns ONLY
  const recommendedExercise: Exercise = {
    id: `T-${s.treatment_id ?? 'session-' + s.id}`,
    name: treatment?.name || treatment?.description || 'Exercise to be assigned',
    description: treatment?.description || 'Exercise details will be available once assigned',
    bodyPart: aiAnalysis.bodyPart || '',
    injuryTypes: aiAnalysis.injuryType ? [aiAnalysis.injuryType] : [],
    defaultSets: s.exercise_sets ?? 3,
    defaultReps: s.exercise_reps ?? 8,
    defaultFrequency: s.exercise_frequency_daily ? `${s.exercise_frequency_daily}x daily` : 'Daily',
    videoUrl: treatment?.video_link || undefined,
    contraindications: aiAnalysis.recommendedExercise?.contraindications || [],
    progressionLevels: aiAnalysis.recommendedExercise?.progressionNotes ? [aiAnalysis.recommendedExercise.progressionNotes] : undefined,
  };

  // Use AI urgency if available, otherwise derive from due date
  let urgency: PatientCase['urgency'] = aiAnalysis.urgencyLevel;
  if (!urgency || urgency === 'medium') {
    const due = s.due_date ? new Date(s.due_date) : null;
    const daysUntilDue = due ? Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    urgency = daysUntilDue !== null
      ? (daysUntilDue <= 2 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low')
      : 'medium';
  }

  const pc: PatientCase = {
    id: String(s.id),
    patientId: s.patient_id ?? 'unknown',
    videoUrl: s.previdurl || '', // Keep for backwards compatibility
    originalVideoUrl: s.previdurl || undefined,
    processedVideoUrl: s.postvidurl || undefined,
    injuryType: aiAnalysis.injuryType || 'General',
    aiAnalysis: aiAnalysis.summary,
    recommendedExercise,
    status: (String(s.status).toLowerCase() as any) || 'pending',
    submittedAt: s.created_at,
    urgency,
    aiConfidence: aiAnalysis.confidence,
    reasoning: aiAnalysis.reasoning,
    movementMetrics: aiAnalysis.movementMetrics,
    rangeOfMotion: aiAnalysis.rangeOfMotion.reduce((acc, rom) => {
      acc[`${rom.joint}${rom.movement}`] = rom.degrees;
      return acc;
    }, {} as Record<string, number>),
    painIndicators: aiAnalysis.painIndicators.map(p => `${p.location}: ${p.type} pain (${p.severity}/10)`),
  };

  // Surface patient notes for doctor view downstream
  (pc as any).patientNotes = s.patient_notes || ''

  return pc;
}

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
      return { items: [], total: 0, stats: { pendingCount: 0, completedToday: 0, averageReviewTimeSec: 0, activePatients: 0, sessionsToday: 0, highPriorityPending: 0, activeCount: 0 } }
    }

    if (!sessions) {
      console.warn('[doctorApi.listCases] no sessions from API')
      return { items: [], total: 0, stats: { pendingCount: 0, completedToday: 0, averageReviewTimeSec: 0, activePatients: 0, sessionsToday: 0, highPriorityPending: 0, activeCount: 0 } }
    }
    console.log('[doctorApi.listCases] sessions fetched', { count: sessions.length })

    // treatmentsById already supplied by route

    // Map DB rows -> PatientCase using AI analysis
    let mapped: PatientCase[] = sessions.map((s) => createPatientCaseFromSession(s, treatmentsById));

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
      (c) => c.status === 'completed' && isSameDay(c.submittedAt)
    ).length;

    // Calculate active patients (unique patient IDs with active status)
    const activePatients = new Set(
      mapped.filter(c => c.status === 'active').map(c => c.patientId)
    ).size;

    // Calculate sessions created today
    const sessionsToday = mapped.filter(c => isSameDay(c.submittedAt)).length;

    // Calculate high priority pending cases
    const highPriorityPending = mapped.filter(c =>
      c.urgency === 'high' && c.status === 'pending'
    ).length;

    // Calculate active cases
    const activeCount = mapped.filter(c => c.status === 'active').length;

    // Calculate average review time based on case complexity
    // Simple heuristic: pending cases take longer, high urgency cases are reviewed faster
    const avgReviewTimeMinutes = pendingCount > 10 ? 25 : pendingCount > 5 ? 18 : 12;
    const averageReviewTimeSec = avgReviewTimeMinutes * 60;

    return {
      items,
      total,
      stats: {
        pendingCount,
        completedToday,
        averageReviewTimeSec,
        activePatients,
        sessionsToday,
        highPriorityPending,
        activeCount
      }
    };
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

      return createPatientCaseFromSession(s, treatmentsById);
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
  },

  async updateCaseStatus(caseId: string, status: 'active' | 'rejected', notes?: string): Promise<boolean> {
    console.log('[doctorApi.updateCaseStatus] updating case status:', { caseId, status, notes });
    try {
      const resp = await fetch(`/api/doctor/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', status, notes })
      });

      if (!resp.ok) {
        console.error('[doctorApi.updateCaseStatus] failed:', resp.status);
        return false;
      }

      console.log('[doctorApi.updateCaseStatus] success');
      return true;
    } catch (e) {
      console.error('[doctorApi.updateCaseStatus] error:', e);
      return false;
    }
  },

  async updateExercise(caseId: string, exerciseData: any): Promise<boolean> {
    console.log('[doctorApi.updateExercise] updating exercise:', { caseId, exerciseData });
    try {
      const resp = await fetch(`/api/doctor/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'exercise', ...exerciseData })
      });

      if (!resp.ok) {
        console.error('[doctorApi.updateExercise] failed:', resp.status);
        return false;
      }

      console.log('[doctorApi.updateExercise] success');
      return true;
    } catch (e) {
      console.error('[doctorApi.updateExercise] error:', e);
      return false;
    }
  },

  async getPatients(doctorId: string): Promise<{ patients: any[], stats: any } | null> {
    console.log('[doctorApi.getPatients] fetching patients for doctor:', doctorId);
    try {
      const resp = await fetch(`/api/doctor/patients?doctorId=${encodeURIComponent(doctorId)}`, {
        cache: 'no-store'
      });

      if (!resp.ok) {
        console.error('[doctorApi.getPatients] failed:', resp.status);
        return null;
      }

      const data = await resp.json();
      console.log('[doctorApi.getPatients] success:', data);
      return data;
    } catch (e) {
      console.error('[doctorApi.getPatients] error:', e);
      return null;
    }
  }
}; 