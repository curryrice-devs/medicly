import { PatientCase } from '@/types/medical.types'

// Simple helper to generate ISO dates offset by days
function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export const mockPatientCases: PatientCase[] = [
  {
    id: 'C-1001',
    patientId: 'P-2001',
    videoUrl: 'https://example.com/videos/shoulder_abduction_1.mp4',
    injuryType: 'Rotator cuff strain',
    aiAnalysis: 'Reduced shoulder abduction with compensatory trunk lean. Suggests supraspinatus weakness.',
    recommendedExercise: {
      id: 'E-shoulder-abduction',
      name: 'Standing Shoulder Abduction with Band',
      description: 'Perform controlled abduction to 90° against light resistance band.',
      bodyPart: 'Shoulder',
      injuryTypes: ['Rotator cuff strain', 'Impingement'],
      defaultSets: 3,
      defaultReps: 10,
      defaultFrequency: 'Daily',
      videoUrl: 'https://example.com/exercises/shoulder_abduction.mp4',
      imageUrl: '/medicly.png',
      difficulty: 'moderate',
      equipment: ['Resistance band'],
      contraindications: ['Acute shoulder pain > 7/10'],
      progressionLevels: ['Band color progression', 'Add isometric holds']
    },
    status: 'pending',
    submittedAt: daysAgo(0),
    urgency: 'high',
    aiConfidence: 0.86,
    reasoning: 'Movement pattern and cadence consistent with rotator cuff weakness.',
    movementMetrics: [
      { label: 'Peak abduction angle', value: 78 },
      { label: 'Trunk lean', value: '12°' },
    ],
    rangeOfMotion: { shoulderAbduction: 78 },
    painIndicators: ['Grimacing at 70°']
  },
  {
    id: 'C-1002',
    patientId: 'P-2002',
    videoUrl: 'https://example.com/videos/knee_squat_1.mp4',
    injuryType: 'Patellofemoral pain',
    aiAnalysis: 'Dynamic valgus during squat descent; suggests weak hip abductors.',
    recommendedExercise: {
      id: 'E-clamshell',
      name: 'Side-Lying Clamshells',
      description: 'Activate gluteus medius with controlled external rotation.',
      bodyPart: 'Hip',
      injuryTypes: ['Patellofemoral pain'],
      defaultSets: 3,
      defaultReps: 12,
      defaultFrequency: '3x/week',
      imageUrl: '/medicly.png',
      difficulty: 'easy',
      equipment: ['Mini band']
    },
    status: 'pending',
    submittedAt: daysAgo(1),
    urgency: 'medium',
    aiConfidence: 0.73,
    movementMetrics: [
      { label: 'Knee valgus angle', value: '9°' },
      { label: 'Squat depth', value: 'Parallel' }
    ],
    rangeOfMotion: { kneeFlexion: 110 },
    painIndicators: ['Reports 3/10 anterior knee pain']
  },
  {
    id: 'C-1003',
    patientId: 'P-2003',
    videoUrl: 'https://example.com/videos/ankle_dorsiflexion_1.mp4',
    injuryType: 'Ankle sprain (lateral)',
    aiAnalysis: 'Limited dorsiflexion ROM; asymmetry compared to contralateral limb.',
    recommendedExercise: {
      id: 'E-ankle-df-mob',
      name: 'Ankle Dorsiflexion Mobilization',
      description: 'Half-kneeling ankle mobilization driving knee over toes.',
      bodyPart: 'Ankle',
      injuryTypes: ['Ankle sprain'],
      defaultSets: 2,
      defaultReps: 15,
      defaultFrequency: 'Daily',
      difficulty: 'easy'
    },
    status: 'completed',
    submittedAt: daysAgo(2),
    urgency: 'low',
    aiConfidence: 0.9,
    movementMetrics: [{ label: 'Dorsiflexion (knee-to-wall)', value: '6 cm' }],
    rangeOfMotion: { ankleDorsiflexion: 12 },
    painIndicators: []
  },
  {
    id: 'C-1004',
    patientId: 'P-2004',
    videoUrl: 'https://example.com/videos/lumbar_flexion_1.mp4',
    injuryType: 'Nonspecific low back pain',
    aiAnalysis: 'Guarded lumbar flexion with decreased segmental motion.',
    recommendedExercise: {
      id: 'E-cat-camel',
      name: 'Cat-Camel Mobility',
      description: 'Segmental spinal flexion/extension in quadruped.',
      bodyPart: 'Spine',
      injuryTypes: ['Low back pain'],
      defaultSets: 2,
      defaultReps: 10,
      defaultFrequency: 'Daily',
      difficulty: 'easy'
    },
    status: 'active',
    submittedAt: daysAgo(3),
    urgency: 'medium',
    aiConfidence: 0.62,
    movementMetrics: [{ label: 'Lumbar flexion range', value: 'Limited' }],
    rangeOfMotion: { lumbarFlexion: 40 },
    painIndicators: ['Reports stiffness on waking']
  },
  {
    id: 'C-1005',
    patientId: 'P-2005',
    videoUrl: 'https://example.com/videos/shoulder_external_rotation_1.mp4',
    injuryType: 'Shoulder impingement',
    aiAnalysis: 'Painful arc between 60°-120° with scapular dyskinesis.',
    recommendedExercise: {
      id: 'E-scap-retraction',
      name: 'Scapular Retraction with Band',
      description: 'Focus on lower trap and rhomboid activation.',
      bodyPart: 'Shoulder',
      injuryTypes: ['Impingement'],
      defaultSets: 3,
      defaultReps: 12,
      defaultFrequency: '3x/week',
      difficulty: 'moderate',
      equipment: ['Resistance band']
    },
    status: 'rejected',
    submittedAt: daysAgo(5),
    urgency: 'low',
    aiConfidence: 0.41,
    movementMetrics: [{ label: 'Painful arc', value: 'Present' }],
    painIndicators: ['Reports 6/10 pain with elevation']
  },
  {
    id: 'C-1006',
    patientId: 'P-2006',
    videoUrl: 'https://example.com/videos/hip_hinge_1.mp4',
    injuryType: 'Proximal hamstring tendinopathy',
    aiAnalysis: 'Early lumbar flexion during hinge; poor hip dissociation.',
    recommendedExercise: {
      id: 'E-rdl',
      name: 'Single-Leg RDL (assisted)',
      description: 'Hip hinge maintaining neutral spine using support.',
      bodyPart: 'Hip',
      injuryTypes: ['Tendinopathy'],
      defaultSets: 3,
      defaultReps: 8,
      defaultFrequency: '3x/week',
      difficulty: 'moderate'
    },
    status: 'pending',
    submittedAt: daysAgo(2),
    urgency: 'high',
    aiConfidence: 0.78,
    movementMetrics: [{ label: 'Lumbar flexion onset', value: 'Early' }],
    painIndicators: ['Reports discomfort at end range']
  },
]


