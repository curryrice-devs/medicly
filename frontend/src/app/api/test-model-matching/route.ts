import { NextResponse } from 'next/server';
import { matchBioDigitalModel } from '@/lib/biodigital-model-matcher';
import { AIAnalysisData } from '@/types/ai-analysis.types';

export const dynamic = 'force-dynamic';

// Test cases
const testCases: { name: string; data: AIAnalysisData }[] = [
  {
    name: "Shoulder Case",
    data: {
      confidence: 0.87,
      primaryDiagnosis: "Rotator cuff impingement syndrome",
      injuryType: "Shoulder impingement",
      bodyPart: "Shoulder",
      summary: "Patient demonstrates classic signs of rotator cuff impingement with compensatory movement patterns. Limited shoulder abduction with painful arc present between 60-120°.",
      reasoning: "Test case",
      movementMetrics: [],
      rangeOfMotion: [],
      compensatoryPatterns: [],
      painIndicators: [{
        location: "Lateral deltoid",
        severity: 6,
        type: "aching",
        triggers: ["overhead movement", "sleeping on affected side"]
      }],
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
      confidence: 0.82,
      primaryDiagnosis: "Medial meniscus tear",
      injuryType: "Knee meniscus injury",
      bodyPart: "Knee",
      summary: "Patient presents with medial knee pain, clicking sensation, and difficulty with deep knee flexion. Observable joint swelling and positive McMurray test suggest meniscal involvement.",
      reasoning: "Test case",
      movementMetrics: [],
      rangeOfMotion: [],
      compensatoryPatterns: [],
      painIndicators: [{
        location: "Medial knee joint line",
        severity: 7,
        type: "sharp",
        triggers: ["deep squatting", "twisting movements"]
      }],
      functionalLimitations: [],
      urgencyLevel: "medium",
      urgencyReason: "Test",
      redFlags: [],
      recommendedExercise: { rationale: "Test", contraindications: [], progressionNotes: "" },
      followUpRecommendations: { timeframe: "1 week", monitorFor: [], progressIndicators: [], escalationCriteria: [] }
    }
  }
];

export async function GET() {
  try {
    console.log('🧪 Testing model matching with sample cases...');
    
    const results = [];
    
    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      console.log(`   Body Part: ${testCase.data.bodyPart}`);
      console.log(`   Injury: ${testCase.data.injuryType}`);
      
      try {
        const match = await matchBioDigitalModel(testCase.data);
        
        if (match) {
          console.log(`   ✅ Selected: ${match.model.name} (${match.model.id})`);
          console.log(`   📊 Confidence: ${Math.round(match.confidence * 100)}%`);
          console.log(`   🎯 Reasoning: ${match.reasoning}`);
          
          results.push({
            testCase: testCase.name,
            success: true,
            selectedModel: {
              id: match.model.id,
              name: match.model.name,
              confidence: match.confidence,
              reasoning: match.reasoning,
              viewerUrl: match.model.viewerUrl
            }
          });
        } else {
          console.log(`   ❌ No model selected (below confidence threshold)`);
          results.push({
            testCase: testCase.name,
            success: false,
            error: 'No model selected - below confidence threshold'
          });
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error}`);
        results.push({
          testCase: testCase.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('\n🎉 Model matching test completed!');
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
