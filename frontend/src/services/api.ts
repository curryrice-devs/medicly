import { 
  PatientCase, 
  CaseStats, 
  Exercise, 
  PatientSearchResult, 
  PatientSearchParams, 
  PatientProfile,
  DoctorPatientRelationship,
  TherapySession
} from '@/types/medical.types';
import { supabaseBrowser } from '@/lib/supabase';

export const doctorApi = {
  async listCases(filters: any): Promise<{ items: PatientCase[], total: number, stats: CaseStats }> {
    // Mock implementation - replace with actual API calls
    return {
      items: [],
      total: 0,
      stats: { pendingCount: 0, completedToday: 0, averageReviewTimeSec: 0 }
    };
  },

  async searchExercises(query: any): Promise<{ items: Exercise[], total: number }> {
    // Mock implementation - replace with actual API calls
    return {
      items: [],
      total: 0
    };
  },

  // Patient search and management
  async searchPatients(params: PatientSearchParams): Promise<{ items: PatientSearchResult[], total: number }> {
    try {
      console.log('Searching patients with params:', params);

      // First, try the RPC function
      const { data, error } = await supabaseBrowser.rpc('search_patients', {
        search_term: params.searchTerm || '',
        doctor_id_param: params.doctorId || null
      });

      if (error) {
        console.error('Error calling search_patients RPC:', error);

        // If RPC fails, try a direct query as fallback
        console.log('RPC failed, trying direct query fallback...');
        return await this.searchPatientsDirect(params);
      }

      console.log('RPC search_patients returned:', data);

      // Map the database response to match the TypeScript interface
      const mappedData = (data || []).map((item: any) => ({
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

      console.log(`Found ${mappedData.length} patients`);

      return {
        items: mappedData,
        total: mappedData.length
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

      let query = supabaseBrowser
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
      const mappedData = (profiles || []).map((profile: any) => ({
        id: profile.id,
        caseId: profile.case_id,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        age: profile.age,
        relationshipStatus: 'unassigned', // Default for direct search
        assignedAt: null,
        lastSession: null,
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
      const { data, error } = await supabaseBrowser
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

  async createPatientProfile(profile: Omit<PatientProfile, 'id' | 'caseId' | 'createdAt' | 'updatedAt'>): Promise<PatientProfile | null> {
    try {
      const { data, error } = await supabaseBrowser
        .from('patient_profiles')
        .insert([profile])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating patient profile:', error);
      throw new Error('Failed to create patient profile');
    }
  },

  async updatePatientProfile(patientId: string, updates: Partial<PatientProfile>): Promise<PatientProfile | null> {
    try {
      const { data, error } = await supabaseBrowser
        .from('patient_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', patientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating patient profile:', error);
      throw new Error('Failed to update patient profile');
    }
  },

  // Doctor-patient relationship management
  async assignPatientToDoctor(doctorId: string, patientId: string, notes?: string): Promise<DoctorPatientRelationship | null> {
    try {
      const { data, error } = await supabaseBrowser
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
      const { data, error } = await supabaseBrowser.rpc('search_patients', {
        search_term: '',
        doctor_id_param: doctorId
      });

      if (error) throw error;

      // Map the database response to match the TypeScript interface
      const mappedData = (data || []).map((item: any) => ({
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

      return mappedData;
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  },

  async updateRelationshipStatus(relationshipId: string, status: 'active' | 'inactive' | 'completed', notes?: string): Promise<DoctorPatientRelationship | null> {
    try {
      const { data, error } = await supabaseBrowser
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
      let query = supabaseBrowser
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
      const updates: any = {
        doctor_notes: notes,
        updated_at: new Date().toISOString()
      };

      if (status) {
        updates.status = status;
      }

      const { data, error } = await supabaseBrowser
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

  // Debug function to help troubleshoot patient search issues
  async debugPatientSearch(): Promise<{
    userInfo: any;
    totalPatients: number;
    userRole: string | null;
    canAccessPatients: boolean;
    rpcFunctionExists: boolean;
  }> {
    try {
      console.log('=== Patient Search Debug ===');

      // Check current user
      const { data: { user }, error: userError } = await supabaseBrowser.auth.getUser();
      console.log('Current user:', user);

      // Check user profile and role
      let userRole = null;
      if (user) {
        const { data: profile } = await supabaseBrowser
          .from('profiles')
          .select('role, onboarded')
          .eq('id', user.id)
          .single();
        userRole = profile?.role || null;
        console.log('User profile:', profile);
      }

      // Try to count total patients (this will test RLS policies)
      const { count: totalPatients, error: countError } = await supabaseBrowser
        .from('patient_profiles')
        .select('*', { count: 'exact', head: true });

      console.log('Patient count query result:', { totalPatients, countError });

      // Test if we can access the search RPC function
      let rpcFunctionExists = false;
      try {
        const { data: rpcData, error: rpcError } = await supabaseBrowser.rpc('search_patients', {
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