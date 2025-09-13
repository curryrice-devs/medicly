'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { matchBioDigitalModel } from '@/lib/biodigital-model-matcher';
import { AIAnalysisData } from '@/types/ai-analysis.types';

// Test cases for fallback matching
const testCases: { name: string; data: AIAnalysisData }[] = [
  {
    name: "Shoulder Case",
    data: {
      confidence: 0.8,
      primaryDiagnosis: "Rotator cuff impingement",
      injuryType: "Shoulder impingement",
      bodyPart: "Shoulder",
      summary: "Patient has shoulder pain with rotator cuff impingement",
      reasoning: "Test case",
      movementMetrics: [],
      rangeOfMotion: [],
      compensatoryPatterns: [],
      painIndicators: [],
      functionalLimitations: [],
      urgencyLevel: "medium",
      urgencyReason: "Test",
      redFlags: [],
      recommendedExercise: { rationale: "Test", contraindications: [], progressionNotes: "" },
      followUpRecommendations: { timeframe: "1 week", monitorFor: [], progressIndicators: [], escalationCriteria: [] }
    }
  },
  {
    name: "Knee Case",
    data: {
      confidence: 0.8,
      primaryDiagnosis: "Meniscus tear",
      injuryType: "Knee injury",
      bodyPart: "Knee",
      summary: "Patient presents with knee pain and meniscus tear symptoms",
      reasoning: "Test case",
      movementMetrics: [],
      rangeOfMotion: [],
      compensatoryPatterns: [],
      painIndicators: [],
      functionalLimitations: [],
      urgencyLevel: "medium",
      urgencyReason: "Test",
      redFlags: [],
      recommendedExercise: { rationale: "Test", contraindications: [], progressionNotes: "" },
      followUpRecommendations: { timeframe: "1 week", monitorFor: [], progressIndicators: [], escalationCriteria: [] }
    }
  },
  {
    name: "Back Case",
    data: {
      confidence: 0.8,
      primaryDiagnosis: "Lumbar strain",
      injuryType: "Lower back pain",
      bodyPart: "Back",
      summary: "Patient has lower back pain with lumbar spine involvement",
      reasoning: "Test case",
      movementMetrics: [],
      rangeOfMotion: [],
      compensatoryPatterns: [],
      painIndicators: [],
      functionalLimitations: [],
      urgencyLevel: "medium",
      urgencyReason: "Test",
      redFlags: [],
      recommendedExercise: { rationale: "Test", contraindications: [], progressionNotes: "" },
      followUpRecommendations: { timeframe: "1 week", monitorFor: [], progressIndicators: [], escalationCriteria: [] }
    }
  }
];

export default function TestFallbackMatching() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setResults([]);
    
    const testResults = [];
    for (const testCase of testCases) {
      try {
        console.log(`Testing ${testCase.name}...`);
        const result = await matchBioDigitalModel(testCase.data);
        testResults.push({
          name: testCase.name,
          success: true,
          result,
          error: null
        });
      } catch (error) {
        testResults.push({
          name: testCase.name,
          success: false,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    setResults(testResults);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Fallback Model Matching Test
        </h1>
        
        <div className="mb-6">
          <Button 
            onClick={runTests} 
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? 'Running Tests...' : 'Run Fallback Tests'}
          </Button>
          
          <p className="text-gray-600 text-sm">
            This tests the fallback model matching when the AI service is unavailable.
            It should work even without the ANTHROPIC_API_KEY set.
          </p>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
            
            {results.map((result, index) => (
              <Card key={index} className={`p-6 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                    {result.name}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                {result.success && result.result ? (
                  <div>
                    <div className="mb-2">
                      <strong>Model:</strong> {result.result.model.name}
                    </div>
                    <div className="mb-2">
                      <strong>Confidence:</strong> {Math.round(result.result.confidence * 100)}%
                    </div>
                    <div className="mb-2">
                      <strong>Reasoning:</strong> {result.result.reasoning}
                    </div>
                    <div className="mb-2">
                      <strong>Relevant Body Parts:</strong> {result.result.relevantBodyParts.join(', ')}
                    </div>
                    <div className="text-xs text-gray-600 break-all">
                      <strong>Model URL:</strong> {result.result.model.viewerUrl}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-700">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
