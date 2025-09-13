'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BioDigitalModelViewer } from '@/components/BioDigitalModelViewer';
import { AIAnalysisData } from '@/types/ai-analysis.types';

// Sample AI analysis data for testing
const sampleShoulderAnalysis: AIAnalysisData = {
  confidence: 0.87,
  primaryDiagnosis: "Rotator cuff impingement syndrome with secondary subacromial bursitis",
  injuryType: "Shoulder impingement",
  bodyPart: "Shoulder",
  summary: "Patient demonstrates classic signs of rotator cuff impingement with compensatory movement patterns. Limited shoulder abduction with painful arc present between 60-120°. Substitution patterns include trunk lateral lean and early scapular elevation. External rotation weakness noted.",
  reasoning: "The painful arc during abduction, combined with compensatory trunk lean and early scapular elevation, strongly suggests subacromial impingement. The inability to maintain proper scapulohumeral rhythm and the visible discomfort during mid-range abduction are characteristic of rotator cuff involvement.",
  movementMetrics: [
    {
      label: "Shoulder Abduction ROM",
      value: 140,
      unit: "degrees",
      normalRange: "0-180°",
      status: "limited"
    },
    {
      label: "Painful Arc",
      value: "Present",
      status: "concerning"
    }
  ],
  rangeOfMotion: [
    {
      joint: "Glenohumeral",
      movement: "Abduction",
      degrees: 140,
      normalRange: "0-180°",
      status: "limited"
    }
  ],
  compensatoryPatterns: [
    "Trunk lateral lean during abduction",
    "Early scapular elevation"
  ],
  painIndicators: [
    {
      location: "Lateral deltoid",
      severity: 6,
      type: "aching",
      triggers: ["overhead movement", "sleeping on affected side"]
    }
  ],
  functionalLimitations: [
    "Difficulty reaching overhead",
    "Pain with lifting objects above shoulder height"
  ],
  urgencyLevel: "medium",
  urgencyReason: "Significant functional limitation present but no acute injury signs",
  redFlags: [],
  recommendedExercise: {
    name: "Pendulum swings",
    rationale: "Promotes gentle passive mobility while minimizing impingement risk",
    contraindications: ["Acute severe pain", "Recent shoulder surgery"],
    progressionNotes: "Progress to active-assisted ROM exercises as pain decreases"
  },
  followUpRecommendations: {
    timeframe: "1 week",
    monitorFor: ["Pain levels", "Range of motion improvement", "Sleep quality"],
    progressIndicators: ["Decreased pain with overhead reach", "Improved sleep position tolerance"],
    escalationCriteria: ["Worsening pain", "New neurological symptoms", "No improvement in 2 weeks"]
  }
};

const sampleKneeAnalysis: AIAnalysisData = {
  confidence: 0.82,
  primaryDiagnosis: "Medial meniscus tear with associated joint effusion",
  injuryType: "Knee meniscus injury",
  bodyPart: "Knee",
  summary: "Patient presents with medial knee pain, clicking sensation, and difficulty with deep knee flexion. Observable joint swelling and positive McMurray test suggest meniscal involvement.",
  reasoning: "The combination of medial joint line tenderness, mechanical symptoms (clicking), and limited deep flexion with pain suggests a medial meniscus tear.",
  movementMetrics: [],
  rangeOfMotion: [
    {
      joint: "Tibiofemoral",
      movement: "Flexion",
      degrees: 110,
      normalRange: "0-135°",
      status: "limited"
    }
  ],
  compensatoryPatterns: [],
  painIndicators: [
    {
      location: "Medial knee joint line",
      severity: 7,
      type: "sharp",
      triggers: ["deep squatting", "twisting movements"]
    }
  ],
  functionalLimitations: [
    "Difficulty with stairs",
    "Pain with deep squatting"
  ],
  urgencyLevel: "medium",
  urgencyReason: "Mechanical symptoms present requiring assessment",
  redFlags: [],
  recommendedExercise: {
    name: "Straight leg raises",
    rationale: "Strengthen quadriceps without knee joint stress",
    contraindications: ["Acute swelling", "Severe pain"],
    progressionNotes: "Progress to closed chain exercises as symptoms improve"
  },
  followUpRecommendations: {
    timeframe: "1 week",
    monitorFor: ["Swelling", "Range of motion", "Mechanical symptoms"],
    progressIndicators: ["Reduced swelling", "Improved flexion"],
    escalationCriteria: ["Locking episodes", "Increased swelling"]
  }
};

export default function TestModelMatching() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysisData | null>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Load available models to show what Claude has to choose from
  const loadAvailableModels = async () => {
    setModelsLoading(true);
    try {
      const response = await fetch('/api/biodigital/models/all');
      const data = await response.json();
      if (data.success && data.models) {
        setAvailableModels(data.models);
        console.log(`Loaded ${data.models.length} available models for Claude to choose from`);
      }
    } catch (error) {
      console.error('Failed to load available models:', error);
    } finally {
      setModelsLoading(false);
    }
  };

  React.useEffect(() => {
    loadAvailableModels();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          BioDigital Model Matching Test
        </h1>

        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Available Models for Claude</h3>
              <p className="text-sm text-blue-700">
                {modelsLoading ? 'Loading models...' : `${availableModels.length} models loaded from your BioDigital library`}
              </p>
            </div>
            <Button onClick={loadAvailableModels} disabled={modelsLoading} size="sm" variant="outline">
              {modelsLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Shoulder Case</h3>
            <p className="text-gray-600 mb-4">
              Rotator cuff impingement with compensatory patterns
            </p>
            <Button 
              onClick={() => setSelectedAnalysis(sampleShoulderAnalysis)}
              className="w-full"
            >
              Test Shoulder Model Matching
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Knee Case</h3>
            <p className="text-gray-600 mb-4">
              Medial meniscus tear with joint effusion
            </p>
            <Button 
              onClick={() => setSelectedAnalysis(sampleKneeAnalysis)}
              className="w-full"
              variant="outline"
            >
              Test Knee Model Matching
            </Button>
          </Card>
        </div>

        {selectedAnalysis && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Selected Case Analysis</h3>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  {selectedAnalysis.primaryDiagnosis}
                </h4>
                <p className="text-blue-800 text-sm">
                  {selectedAnalysis.summary}
                </p>
              </div>
            </Card>

            <BioDigitalModelViewer 
              aiAnalysis={selectedAnalysis}
              className="mb-6"
            />

            {/* Debug info */}
            <Card className="p-4 bg-gray-50 border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Debug Info</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Patient Summary:</strong> {selectedAnalysis.summary}</p>
                <p><strong>Body Part:</strong> {selectedAnalysis.bodyPart}</p>
                <p><strong>Injury Type:</strong> {selectedAnalysis.injuryType}</p>
                <p><strong>Available Models:</strong> {availableModels.length} models from BioDigital API</p>
              </div>
            </Card>

            <Button 
              onClick={() => setSelectedAnalysis(null)}
              variant="outline"
            >
              Clear Test
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
