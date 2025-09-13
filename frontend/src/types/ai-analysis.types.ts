// AI Analysis JSON Schema
// This is what you should ask the LLM to return for each video analysis

export interface MovementMetric {
  label: string;
  value: string | number;
  unit?: string;
  normalRange?: string;
  status?: 'normal' | 'limited' | 'concerning';
}

export interface RangeOfMotionMeasurement {
  joint: string;
  movement: string; // e.g., 'flexion', 'extension', 'abduction'
  degrees: number;
  normalRange: string; // e.g., '0-180°'
  status: 'normal' | 'limited' | 'hypermobile';
}

export interface PainIndicator {
  location: string;
  severity: number; // 0-10 scale
  type: 'sharp' | 'dull' | 'burning' | 'aching' | 'throbbing';
  triggers: string[];
}

export interface AIAnalysisData {
  // Overall assessment
  confidence: number; // 0-1 (0.85 = 85% confidence)
  primaryDiagnosis: string;
  injuryType: string; // replaces hardcoded 'General'
  bodyPart: string; // replaces empty string

  // Detailed analysis
  summary: string; // Main analysis text for doctor review
  reasoning: string; // Why this diagnosis was reached

  // Movement assessment
  movementMetrics: MovementMetric[];
  rangeOfMotion: RangeOfMotionMeasurement[];
  compensatoryPatterns: string[];

  // Pain and symptoms
  painIndicators: PainIndicator[];
  functionalLimitations: string[];

  // Risk assessment
  urgencyLevel: 'low' | 'medium' | 'high';
  urgencyReason: string;
  redFlags: string[]; // Concerning findings that need immediate attention

  // Exercise recommendation
  recommendedExercise: {
    name?: string; // Exercise name (backwards compatibility)
    rationale: string; // Why this exercise was chosen
    contraindications: string[];
    progressionNotes: string;
  };


  // Follow-up recommendations
  followUpRecommendations: {
    timeframe: string; // '1 week', '2 weeks', etc.
    monitorFor: string[]; // Things to watch for
    progressIndicators: string[]; // Signs of improvement
    escalationCriteria: string[]; // When to refer or reassess
  };
}

// Example of what you should ask the LLM to return:
export const AI_ANALYSIS_PROMPT_EXAMPLE = `
Please analyze this physical therapy video and return a JSON response with the following structure:

{
  "confidence": 0.85,
  "primaryDiagnosis": "Rotator cuff impingement syndrome",
  "injuryType": "Shoulder impingement",
  "bodyPart": "Shoulder",
  "summary": "Patient demonstrates limited shoulder abduction with compensatory movements indicating rotator cuff weakness and possible impingement.",
  "reasoning": "Observed painful arc between 60-120° of abduction, substitution patterns with trunk lean, and decreased external rotation strength.",
  "movementMetrics": [
    {
      "label": "Shoulder Abduction ROM",
      "value": 140,
      "unit": "degrees",
      "normalRange": "0-180°",
      "status": "limited"
    },
    {
      "label": "Painful Arc",
      "value": "Present",
      "status": "concerning"
    }
  ],
  "rangeOfMotion": [
    {
      "joint": "Glenohumeral",
      "movement": "Abduction",
      "degrees": 140,
      "normalRange": "0-180°",
      "status": "limited"
    }
  ],
  "compensatoryPatterns": [
    "Trunk lateral lean during abduction",
    "Early scapular elevation"
  ],
  "painIndicators": [
    {
      "location": "Lateral deltoid",
      "severity": 6,
      "type": "aching",
      "triggers": ["overhead movement", "sleeping on affected side"]
    }
  ],
  "functionalLimitations": [
    "Difficulty reaching overhead",
    "Pain with lifting objects"
  ],
  "urgencyLevel": "medium",
  "urgencyReason": "Significant functional limitation but no acute injury",
  "redFlags": [],
  "recommendedExercise": {
    "rationale": "Promotes gentle mobility while reducing impingement risk",
    "contraindications": ["Acute inflammation", "Recent surgery"],
    "progressionNotes": "Progress to active-assisted ROM as pain decreases"
  },
  "followUpRecommendations": {
    "timeframe": "1 week",
    "monitorFor": ["Pain levels", "Range of motion improvement", "Sleep quality"],
    "progressIndicators": ["Decreased pain with overhead reach", "Improved sleep position tolerance"],
    "escalationCriteria": ["Worsening pain", "New neurological symptoms", "No improvement in 2 weeks"]
  }
}
`;

// Helper function to safely parse AI analysis JSON
export function parseAIAnalysis(aiEvaluationData: any): AIAnalysisData | null {
  try {
    let parsed: any;

    // Handle different input types
    if (typeof aiEvaluationData === 'string') {
      // Try to parse as JSON string
      if (aiEvaluationData.trim().startsWith('{')) {
        parsed = JSON.parse(aiEvaluationData);
      } else {
        // Plain text, return null to fall back
        return null;
      }
    } else if (typeof aiEvaluationData === 'object' && aiEvaluationData !== null) {
      // Already an object (JSONB from database)
      parsed = aiEvaluationData;
    } else {
      return null;
    }

    // Handle API response format: {message, success, analysis}
    if (parsed.analysis && typeof parsed.analysis === 'object') {
      // Extract the actual analysis from the API response wrapper
      parsed = parsed.analysis;
    }

    // Validate required fields for the old format
    if (parsed.confidence && parsed.primaryDiagnosis && parsed.summary) {
      return parsed as AIAnalysisData;
    }

    // Handle new two-stage analysis format
    if (parsed.analysis_summary) {
      const summary = parsed.analysis_summary;
      return {
        confidence: summary.confidence_level || 0.8,
        primaryDiagnosis: summary.movement_identified || "Assessment pending",
        injuryType: summary.movement_identified || "General",
        bodyPart: "",
        summary: summary.overall_health_assessment || "Analysis pending",
        reasoning: summary.main_recommendations?.join('. ') || "Analysis in progress",
        movementMetrics: [],
        rangeOfMotion: [],
        compensatoryPatterns: [],
        painIndicators: summary.key_concerns?.map((concern: string, index: number) => ({
          location: "Unknown",
          severity: 5,
          type: "aching" as any,
          triggers: [concern]
        })) || [],
        functionalLimitations: [],
        urgencyLevel: summary.technique_quality === 'poor' ? 'high' : 
                     summary.technique_quality === 'excellent' ? 'low' : 'medium',
        urgencyReason: summary.technique_quality ? `${summary.technique_quality} technique quality` : 'Assessment pending',
        redFlags: [],
        recommendedExercise: {
          name: summary.movement_identified || "Exercise to be assigned",
          contraindications: [],
          progressionNotes: summary.main_recommendations?.join('. ')
        }
      } as AIAnalysisData;
    }

    // If none of the expected formats match, return null to fall back
    return null;
  } catch (error) {
    console.error('Failed to parse AI analysis JSON:', error);
    return null;
  }
}

// Fallback function for backwards compatibility with existing text-only evaluations
export function createFallbackAnalysis(textAnalysis: string | any): AIAnalysisData {
  // Handle case where an object is passed instead of a string
  let summaryText: string;
  if (typeof textAnalysis === 'object' && textAnalysis !== null) {
    // If it's an object with message, success, analysis structure, extract a meaningful summary
    if (textAnalysis.message && typeof textAnalysis.message === 'string') {
      summaryText = textAnalysis.message;
    } else {
      summaryText = "Analysis data available but in unexpected format";
    }
  } else {
    summaryText = textAnalysis || "Awaiting AI evaluation";
  }

  return {
    confidence: 0.8,
    primaryDiagnosis: "Assessment pending",
    injuryType: "General",
    bodyPart: "",
    summary: summaryText,
    reasoning: "Legacy analysis format",
    movementMetrics: [],
    rangeOfMotion: [],
    compensatoryPatterns: [],
    painIndicators: [],
    functionalLimitations: [],
    urgencyLevel: 'medium',
    urgencyReason: "Standard follow-up needed",
    redFlags: [],
    recommendedExercise: {
      rationale: "Maintain mobility and function",
      contraindications: [],
      progressionNotes: ""
    },
    followUpRecommendations: {
      timeframe: "1-2 weeks",
      monitorFor: ["Pain levels", "Functional improvement"],
      progressIndicators: ["Improved movement", "Reduced pain"],
      escalationCriteria: ["Worsening symptoms", "No improvement"]
    }
  };
}