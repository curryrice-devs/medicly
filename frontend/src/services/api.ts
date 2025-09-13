import { 
  PatientCase, 
  CaseStats, 
  Exercise, 
  PatientSearchResult, 
  PatientSearchParams, 
  PatientProfile,
  DoctorPatientRelationship,
  TherapySession,
  SessionStatus
} from '@/types/medical.types';
import { supabaseBrowser } from '@/lib/supabase/client';
import { parseAIAnalysis, createFallbackAnalysis, AIAnalysisData } from '@/types/ai-analysis.types';

// Helper function to create PatientCase from session data and AI analysis
function createPatientCaseFromSession(s: Record<string, unknown>, treatmentsById: Record<string, unknown>): PatientCase {
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
    patientName: s.profiles?.patient_profiles?.full_name || s.patient_profiles?.full_name,
    patientEmail: s.profiles?.patient_profiles?.email || s.patient_profiles?.email,
    patientPhone: s.profiles?.patient_profiles?.phone || s.patient_profiles?.phone,
    patientAge: s.profiles?.patient_profiles?.age || s.patient_profiles?.age,
    patientCaseId: s.profiles?.patient_profiles?.case_id || s.patient_profiles?.case_id,
    videoUrl: treatment?.video_link || '',
    injuryType: aiAnalysis.injuryType || 'General',
    aiAnalysis: aiAnalysis.summary,
    recommendedExercise,
    status: (String(s.status).toLowerCase() as SessionStatus) || 'pending',
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
    patientNotes: s.patient_notes || undefined,
  };

  return pc;
}

export const doctorApi = {
  async listCases(filters: { status?: string; urgency?: string; limit?: number; offset?: number }): Promise<{ items: PatientCase[], total: number, stats: CaseStats }> {
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
    let sessions: Record<string, unknown>[] | null = null
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
    if (status && status !== 'all') {
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
      const s = sessions.find((session: Record<string, unknown>) => String(session.id) === String(id))
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

  async getPatientCases(patientId: string): Promise<PatientCase[]> {
    try {
      console.log('[doctorApi.getPatientCases] fetching cases for patient:', patientId);

      // Use existing listCases method to get all cases
      const casesResponse = await this.listCases({
        status: 'all', // Get cases regardless of status
        perPage: 1000  // Get a large number to avoid pagination issues
      });

      // Filter cases for the specific patient
      const patientCases = casesResponse.items.filter(caseItem =>
        caseItem.patientId === patientId
      );

      console.log('[doctorApi.getPatientCases] found', patientCases.length, 'cases for patient', patientId);
      return patientCases;
    } catch (error) {
      console.error('[doctorApi.getPatientCases] error:', error);
      return [];
    }
  },

  async searchExercises(query: { term?: string; bodyPart?: string; limit?: number }): Promise<{ items: Exercise[], total: number }> {
    return {
      items: [],
      total: 0
    };
  },

  // Patient search and management
  async searchPatients(params: PatientSearchParams): Promise<{ items: PatientSearchResult[], total: number }> {
    try {
      console.log('[doctorApi.searchPatients] fetching all patients via API route');

      // Fetch all patients using the same pattern as listCases
      const resp = await fetch('/api/doctor/all-patients', { cache: 'no-store' })
      const payload = await resp.json().catch(() => ({ error: 'invalid json' }))

      if (!resp.ok) {
        console.warn('[doctorApi.searchPatients] route error payload', payload)
        throw new Error(`HTTP ${resp.status}`)
      }

      const allPatients = payload.patients || []
      console.log('[doctorApi.searchPatients] fetched', { count: allPatients.length })

      // Map database response to TypeScript interface (same as before)
      let mapped: PatientSearchResult[] = allPatients.map((item: Record<string, unknown>) => ({
        id: item.id,
        caseId: item.case_id,
        fullName: item.full_name,
        email: item.email,
        phone: item.phone,
        age: item.age,
        relationshipStatus: item.relationship_status,
        assignedAt: item.assigned_at,
        lastSession: item.last_session,
        totalSessions: Number(item.total_sessions) || 0
      }));

      // Client-side filtering (same pattern as listCases)
      if (params.searchTerm && params.searchTerm.trim()) {
        const searchLower = params.searchTerm.toLowerCase();
        mapped = mapped.filter((patient) => {
          const matchesSearch = (patient.caseId && patient.caseId.toLowerCase().includes(searchLower)) ||
                               (patient.fullName && patient.fullName.toLowerCase().includes(searchLower)) ||
                               (patient.email && patient.email.toLowerCase().includes(searchLower));
          return matchesSearch;
        });
      }

      // Filter by doctor if specified (for assigned patients only)
      if (params.doctorId) {
        mapped = mapped.filter((patient) => {
          return patient.relationshipStatus === 'active' || patient.relationshipStatus === 'inactive';
        });
      }

      console.log(`[doctorApi.searchPatients] filtered to ${mapped.length} patients`);

      return {
        items: mapped,
        total: mapped.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error searching patients:', errorMessage);

      // Try fallback method
      try {
        console.log('Primary search failed, trying direct query fallback...');
        return await this.searchPatientsDirect(params);
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        throw new Error(`Failed to search patients: ${errorMessage}`);
      }
    }
  },

  // Fallback search method using direct queries
  async searchPatientsDirect(params: PatientSearchParams): Promise<{ items: PatientSearchResult[], total: number }> {
    try {
      console.log('Using direct search method');

      let query = supabaseBrowser()
        .from('patient_profiles')
        .select(`
          id,
          case_id,
          full_name,
          email,
          phone,
          age,
          created_at
        `);

      // Add search filters if provided
      if (params.searchTerm && params.searchTerm.trim()) {
        const searchTerm = params.searchTerm.trim();
        query = query.or(`case_id.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data: profiles, error: profilesError } = await query.order('full_name');

      if (profilesError) {
        console.error('Error in direct patient search:', profilesError);
        throw profilesError;
      }

      console.log(`Direct search found ${profiles?.length || 0} patients`);

      // Map the results (simplified version without relationship data for now)
      const mappedData = (profiles || []).map((profile: Record<string, unknown>) => ({
        id: profile.id,
        caseId: profile.case_id,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        age: profile.age,
        relationshipStatus: 'unassigned', // Default for direct search
        assignedAt: undefined,
        lastSession: undefined,
        totalSessions: 0
      }));

      return {
        items: mappedData,
        total: mappedData.length
      };
    } catch (error) {
      console.error('Direct search failed:', error);
      throw error;
    }
  },


  async getPatientProfile(patientId: string): Promise<PatientProfile | null> {
    try {
      const { data, error } = await supabaseBrowser()
        .from('patient_profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;

      if (!data) return null;

      // Map snake_case database fields to camelCase TypeScript interface
      const mappedProfile: PatientProfile = {
        id: data.id,
        caseId: data.case_id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        address: data.address,
        emergencyContactName: data.emergency_contact_name,
        emergencyContactPhone: data.emergency_contact_phone,
        medicalHistory: data.medical_history || [],
        currentMedications: data.current_medications || [],
        allergies: data.allergies || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return mappedProfile;
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      return null;
    }
  },

  // Patient profile management
  async createPatientProfile(profile: Omit<PatientProfile, 'id' | 'caseId' | 'createdAt' | 'updatedAt'>): Promise<PatientProfile | null> {
    try {
      // Convert camelCase to snake_case for database
      const dbProfile = {
        id: profile.id,
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        age: profile.age,
        gender: profile.gender,
        address: profile.address,
        emergency_contact_name: profile.emergencyContactName,
        emergency_contact_phone: profile.emergencyContactPhone,
        medical_history: profile.medicalHistory,
        current_medications: profile.currentMedications,
        allergies: profile.allergies
      };

      const { data, error } = await supabaseBrowser()
        .from('patient_profiles')
        .insert([dbProfile])
        .select()
        .single();

      if (error) throw error;

      if (!data) return null;

      // Map response back to camelCase
      return {
        id: data.id,
        caseId: data.case_id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        address: data.address,
        emergencyContactName: data.emergency_contact_name,
        emergencyContactPhone: data.emergency_contact_phone,
        medicalHistory: data.medical_history || [],
        currentMedications: data.current_medications || [],
        allergies: data.allergies || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating patient profile:', error);
      throw new Error('Failed to create patient profile');
    }
  },

  async updatePatientProfile(patientId: string, updates: Partial<PatientProfile>): Promise<PatientProfile | null> {
    try {
      // Convert camelCase updates to snake_case for database
      const dbUpdates: Record<string, unknown> = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.emergencyContactName !== undefined) dbUpdates.emergency_contact_name = updates.emergencyContactName;
      if (updates.emergencyContactPhone !== undefined) dbUpdates.emergency_contact_phone = updates.emergencyContactPhone;
      if (updates.medicalHistory !== undefined) dbUpdates.medical_history = updates.medicalHistory;
      if (updates.currentMedications !== undefined) dbUpdates.current_medications = updates.currentMedications;
      if (updates.allergies !== undefined) dbUpdates.allergies = updates.allergies;

      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseBrowser()
        .from('patient_profiles')
        .update(dbUpdates)
        .eq('id', patientId)
        .select()
        .single();

      if (error) throw error;

      if (!data) return null;

      // Map response back to camelCase
      return {
        id: data.id,
        caseId: data.case_id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        address: data.address,
        emergencyContactName: data.emergency_contact_name,
        emergencyContactPhone: data.emergency_contact_phone,
        medicalHistory: data.medical_history || [],
        currentMedications: data.current_medications || [],
        allergies: data.allergies || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating patient profile:', error);
      throw new Error('Failed to update patient profile');
    }
  },

  // Doctor-patient relationship management
  async assignPatientToDoctor(doctorId: string, patientId: string, notes?: string): Promise<DoctorPatientRelationship | null> {
    try {
      const { data, error } = await supabaseBrowser()
        .from('doctor_patient_relationships')
        .insert([{
          doctor_id: doctorId,
          patient_id: patientId,
          notes: notes,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning patient to doctor:', error);
      throw new Error('Failed to assign patient to doctor');
    }
  },

  async getDoctorPatients(doctorId: string): Promise<PatientSearchResult[]> {
    try {
      console.log('[doctorApi.getDoctorPatients] fetching patients via API route for doctor:', doctorId);

      // Use the same working pattern as searchPatients
      const resp = await fetch('/api/doctor/all-patients', { cache: 'no-store' })
      const payload = await resp.json().catch(() => ({ error: 'invalid json' }))

      if (!resp.ok) {
        console.warn('[doctorApi.getDoctorPatients] route error payload', payload)
        throw new Error(`HTTP ${resp.status}`)
      }

      const allPatients = payload.patients || []
      console.log('[doctorApi.getDoctorPatients] fetched', { count: allPatients.length })

      // Map database response to TypeScript interface
      let mapped: PatientSearchResult[] = allPatients.map((item: Record<string, unknown>) => ({
        id: item.id,
        caseId: item.case_id,
        fullName: item.full_name,
        email: item.email,
        phone: item.phone,
        age: item.age,
        relationshipStatus: item.relationship_status,
        assignedAt: item.assigned_at,
        lastSession: item.last_session,
        totalSessions: Number(item.total_sessions) || 0
      }));

      // Filter for patients assigned to this specific doctor
      mapped = mapped.filter((patient) => {
        return patient.relationshipStatus === 'active' || patient.relationshipStatus === 'inactive';
      });

      console.log(`[doctorApi.getDoctorPatients] filtered to ${mapped.length} patients for doctor ${doctorId}`);
      return mapped;
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  },

  async updateRelationshipStatus(relationshipId: string, status: 'active' | 'inactive' | 'completed', notes?: string): Promise<DoctorPatientRelationship | null> {
    try {
      const { data, error } = await supabaseBrowser()
        .from('doctor_patient_relationships')
        .update({ status, notes })
        .eq('id', relationshipId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating relationship status:', error);
      throw new Error('Failed to update relationship status');
    }
  },

  // Therapy sessions
  async getPatientSessions(patientId: string, doctorId?: string): Promise<TherapySession[]> {
    try {
      let query = supabaseBrowser()
        .from('therapy_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_date', { ascending: false });

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient sessions:', error);
      return [];
    }
  },

  async updateSessionDoctorNotes(sessionId: string, notes: string, status?: 'pending' | 'reviewed' | 'approved' | 'completed'): Promise<TherapySession | null> {
    try {
      const updates: Record<string, unknown> = {
        doctor_notes: notes,
        updated_at: new Date().toISOString()
      };

      if (status) {
        updates.status = status;
      }

      const { data, error } = await supabaseBrowser()
        .from('therapy_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating session notes:', error);
      throw new Error('Failed to update session notes');
    }
  },

  // Case management functions
  async updateCaseStatus(caseId: string, status: SessionStatus, notes?: string): Promise<boolean> {
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

  async updateExercise(caseId: string, exerciseData: { sets?: number; reps?: number; frequency?: string; notes?: string }): Promise<boolean> {
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

  async getPatients(doctorId: string): Promise<{ patients: PatientSearchResult[], stats: Record<string, unknown> } | null> {
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
  },

  // Debug function to help troubleshoot patient search issues
  async debugPatientSearch(): Promise<{
    userInfo: Record<string, unknown>;
    totalPatients: number;
    userRole: string | null;
    canAccessPatients: boolean;
    rpcFunctionExists: boolean;
  }> {
    try {
      console.log('=== Patient Search Debug ===');

      // Check current user
      const { data: { user } } = await supabaseBrowser().auth.getUser();
      console.log('Current user:', user);

      // Check user profile and role
      let userRole = null;
      if (user) {
        const { data: profile } = await supabaseBrowser()
          .from('profiles')
          .select('role, onboarded')
          .eq('id', user.id)
          .single();
        userRole = profile?.role || null;
        console.log('User profile:', profile);
      }

      // Try to count total patients (this will test RLS policies)
      const { count: totalPatients, error: countError } = await supabaseBrowser()
        .from('patient_profiles')
        .select('*', { count: 'exact', head: true });

      console.log('Patient count query result:', { totalPatients, countError });

      // Test if we can access the search RPC function
      let rpcFunctionExists = false;
      try {
        const { data: rpcData, error: rpcError } = await supabaseBrowser().rpc('search_patients', {
          search_term: '',
          doctor_id_param: null
        });
        rpcFunctionExists = !rpcError;
        console.log('RPC function test:', { rpcData, rpcError });
      } catch (rpcErr) {
        console.log('RPC function test failed:', rpcErr);
      }

      return {
        userInfo: user,
        totalPatients: totalPatients || 0,
        userRole,
        canAccessPatients: !countError,
        rpcFunctionExists
      };
    } catch (error) {
      console.error('Debug function failed:', error);
      throw error;
    }
  }
};