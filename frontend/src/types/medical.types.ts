export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  bodyPart: string;
  injuryTypes: string[];
  defaultSets: number;
  defaultReps: number;
  defaultFrequency: string;
  videoUrl?: string;
  imageUrl?: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  equipment?: string[];
  contraindications?: string[];
  progressionLevels?: string[];
}

export interface MovementMetric {
  label: string;
  value: string | number;
}

export interface PatientContext {
  patientId: string;
  age?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'high';
  medicalHistory?: string[];
  previousSessions?: number;
  previousExercises?: Array<{ name: string; adherence?: number }>;
  selfReportedPain?: number; // 0-10
  symptoms?: string[];
  injuryMechanism?: string;
  injuryOnset?: string;
}

export interface PatientCase {
  id: string;
  patientId: string;
  videoUrl: string;
  injuryType: string;
  aiAnalysis: string;
  recommendedExercise: Exercise;
  status: 'pending' | 'approved' | 'modified' | 'rejected';
  submittedAt: string; // ISO date
  urgency: UrgencyLevel;
  aiConfidence?: number; // 0-1
  reasoning?: string;
  movementMetrics?: MovementMetric[];
  rangeOfMotion?: Record<string, number>; // e.g., { shoulderElevation: 87 }
  painIndicators?: string[];
}

export interface PrescriptionParams {
  sets: number;
  reps: number;
  frequency: string; // e.g., Daily, 3x/week
  durationWeeks: number; // 2-12
  instructions?: string;
}

export interface DoctorActionLog {
  id: string;
  caseId: string;
  action: 'viewed' | 'accepted' | 'modified' | 'rejected' | 'autosaved';
  timestamp: string; // ISO
  details?: Record<string, any>;
}

export interface CaseStats {
  pendingCount: number;
  completedToday: number;
  averageReviewTimeSec: number;
}

// New types for patient profiles and relationships

export interface PatientProfile {
  id: string;
  caseId: string;
  fullName: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DoctorPatientRelationship {
  id: string;
  doctorId: string;
  patientId: string;
  status: 'active' | 'inactive' | 'completed';
  assignedAt: string;
  notes?: string;
}

export interface TherapySession {
  id: string;
  patientId: string;
  doctorId?: string;
  caseId?: string;
  sessionType: string;
  injuryType?: string;
  sessionData?: any; // JSON data for video analysis, exercises, etc.
  aiAnalysis?: string;
  doctorNotes?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'completed';
  urgency: UrgencyLevel;
  sessionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientSearchResult {
  id: string;
  caseId: string;
  fullName: string;
  email?: string;
  phone?: string;
  age?: number;
  relationshipStatus: string;
  assignedAt?: string;
  lastSession?: string;
  totalSessions: number;
}

export interface PatientSearchParams {
  searchTerm?: string;
  doctorId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

 