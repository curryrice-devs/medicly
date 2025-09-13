export type UrgencyLevel = 'low' | 'medium' | 'high';

// Session status types - centralized for consistency
export type SessionStatus = 'pending' | 'active' | 'rejected' | 'completed' | 'feedback';

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
  patientName?: string; // Patient name from profiles table
  videoUrl: string; // Keep for backwards compatibility - will use previdurl
  originalVideoUrl?: string; // previdurl - patient's original uploaded video
  processedVideoUrl?: string; // postvidurl - processed video with pose analysis
  injuryType: string;
  aiAnalysis: string | any; // Can be string or JSONB object
  recommendedExercise: Exercise;
  status: SessionStatus; // Updated to use the centralized type
  submittedAt: string; // ISO date
  urgency: UrgencyLevel;
  aiConfidence?: number; // 0-1
  reasoning?: string | any; // Can be string or object
  movementMetrics?: MovementMetric[];
  rangeOfMotion?: Record<string, number>; // e.g., { shoulderElevation: 87 }
  painIndicators?: string[];
  patientNotes?: string; // Patient's notes to the doctorasd
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
  activePatients: number;
  sessionsToday: number;
  highPriorityPending: number;
  activeCount: number;
}

 