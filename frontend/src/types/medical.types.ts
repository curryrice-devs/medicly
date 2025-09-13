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
  category?: string;
  muscleGroups?: string[];
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
  status: 'pending' | 'active' | 'rejected' | 'completed';
  submittedAt: string; // ISO date
  urgency: UrgencyLevel;
  aiConfidence?: number; // 0-1
  reasoning?: string;
  movementMetrics?: MovementMetric[];
  rangeOfMotion?: Record<string, number>; // e.g., { shoulderElevation: 87 }
  painIndicators?: string[];
  affected_model?: string; // URL to BioDigital model for AI analysis preview
  exercise_models?: string; // Comma-separated URLs to BioDigital models for recommended exercises
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

 