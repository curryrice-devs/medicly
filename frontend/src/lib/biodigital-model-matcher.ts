/**
 * BioDigital Model Matcher - AI-powered matching of patient symptoms to anatomical models
 * Uses Claude to analyze patient summaries and find the best matching BioDigital model
 */

import { BIODIGITAL_MODELS } from './biodigital-model-lookup';
import { BioDigitalModel } from './biodigital-model-manager';
import { AIAnalysisData } from '@/types/ai-analysis.types';

export interface ModelMatch {
  model: BioDigitalModel;
  confidence: number;
  reasoning: string;
  relevantBodyParts: string[];
}

export interface ModelMatchRequest {
  patientSummary: string;
  bodyPart?: string;
  injuryType?: string;
  painIndicators?: Array<{
    location: string;
    severity: number;
    type: string;
    triggers: string[];
  }>;
}

/**
 * Fetches real BioDigital models from the API
 */
async function fetchRealBioDigitalModels(): Promise<any[]> {
  try {
    const response = await fetch('/api/biodigital/models/all');
    const data = await response.json();
    
    if (data.success && data.models) {
      return data.models;
    }
    
    console.warn('Failed to fetch real BioDigital models, using static fallback');
    return BIODIGITAL_MODELS;
  } catch (error) {
    console.warn('Error fetching real BioDigital models:', error);
    return BIODIGITAL_MODELS;
  }
}

/**
 * Matches patient symptoms to the best BioDigital anatomical model using Claude AI
 */
export async function matchBioDigitalModel(
  aiAnalysis: AIAnalysisData
): Promise<ModelMatch | null> {
  try {
    // First, try to get real BioDigital models from the API
    const availableModels = await fetchRealBioDigitalModels();
    console.log(`[Model Matcher] Loaded ${availableModels.length} available models`);
    
    // Prepare the request data
    const matchRequest: ModelMatchRequest = {
      patientSummary: aiAnalysis.summary,
      bodyPart: aiAnalysis.bodyPart,
      injuryType: aiAnalysis.injuryType,
      painIndicators: aiAnalysis.painIndicators
    };

    console.log(`[Model Matcher] Matching for: ${aiAnalysis.bodyPart} - ${aiAnalysis.injuryType}`);

    // Create the prompt for Claude
    const prompt = createModelMatchingPrompt(matchRequest);

    // Call our API endpoint that will use Claude to analyze and match
    const response = await fetch('/api/biodigital/match-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        availableModels,
        patientData: matchRequest
      })
    });

    // Handle special case where AI service is unavailable (503)
    if (response.status === 503) {
      console.log('[Model Matcher] AI service unavailable, using fallback matching');
      // Use fallback matching with real models
      const fallbackResult = fallbackModelMatch(aiAnalysis, availableModels);
      console.log(`[Model Matcher] Fallback selected: ${fallbackResult.model.name} (${fallbackResult.model.id})`);
      return fallbackResult;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Model matching failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log(`[Model Matcher] Claude selected: ${result.match.model.name} (${result.match.model.id})`);
    return result.match;

  } catch (error) {
    console.error('Error matching BioDigital model:', error);
    
    // Try to get real models for fallback
    const availableModels = await fetchRealBioDigitalModels().catch(() => BIODIGITAL_MODELS);
    
    // Fallback to rule-based matching
    const fallback = fallbackModelMatch(aiAnalysis, availableModels);
    
    // Clean up reasoning for fallback
    fallback.reasoning = 'Selected based on symptoms';
    
    return fallback;
  }
}

/**
 * Creates a detailed prompt for Claude to analyze patient symptoms and match to models
 */
function createModelMatchingPrompt(request: ModelMatchRequest): string {
  return `
You are a medical AI assistant. Select the SINGLE BEST anatomical model from the available options for this patient case.

PATIENT CASE:
- Summary: ${request.patientSummary}
- Body Part: ${request.bodyPart || 'Not specified'}
- Injury Type: ${request.injuryType || 'Not specified'}
- Pain Locations: ${request.painIndicators?.map(p => `${p.location} (${p.severity}/10, ${p.type})`).join(', ') || 'None specified'}

TASK:
Select the model that best shows the affected anatomy for this patient's condition.

RESPONSE FORMAT:
Return only a JSON object with:
{
  "selectedModelId": "exact_model_id_from_list",
  "confidence": 0.9
}

Choose the most relevant model based on the patient's primary affected body part and injury type.
`;
}

/**
 * Fallback rule-based matching when AI is unavailable
 */
function fallbackModelMatch(aiAnalysis: AIAnalysisData, availableModels: any[] = BIODIGITAL_MODELS): ModelMatch {
  const bodyPart = (aiAnalysis.bodyPart || '').toLowerCase();
  const injuryType = (aiAnalysis.injuryType || '').toLowerCase();
  const summary = (aiAnalysis.summary || '').toLowerCase();
  
  // Combine all text for keyword matching
  const allText = `${bodyPart} ${injuryType} ${summary}`;

  // Default fallback
  let bestMatch = availableModels[0] || BIODIGITAL_MODELS[0];
  let confidence = 0.4;
  let reasoning = 'Selected for anatomy visualization';
  let relevantBodyParts = [bodyPart || 'general'];

  // More comprehensive keyword matching
  const matchingRules = [
    {
      keywords: ['shoulder', 'rotator cuff', 'impingement', 'deltoid', 'scapular', 'clavicle', 'arm', 'upper limb', 'humerus', 'elbow'],
      confidence: 0.8,
      reasoning: 'Upper limb anatomy',
      bodyParts: ['shoulder', 'arm', 'upper limb']
    },
    {
      keywords: ['knee', 'meniscus', 'patella', 'ligament', 'acl', 'mcl', 'quadriceps', 'hamstring', 'tibia', 'femur'],
      confidence: 0.8,
      reasoning: 'Lower limb anatomy',
      bodyParts: ['knee', 'leg']
    },
    {
      keywords: ['hip', 'pelvis', 'femur', 'groin', 'iliopsoas', 'glute', 'acetabulum'],
      confidence: 0.8,
      reasoning: 'Hip and pelvis anatomy',
      bodyParts: ['hip', 'pelvis']
    },
    {
      keywords: ['back', 'spine', 'lumbar', 'cervical', 'thoracic', 'vertebra', 'disc', 'spinal'],
      confidence: 0.7,
      reasoning: 'Spinal anatomy',
      bodyParts: ['spine', 'back']
    },
    {
      keywords: ['ankle', 'foot', 'achilles', 'calf', 'plantar', 'heel', 'toe', 'metatarsal'],
      confidence: 0.8,
      reasoning: 'Foot and ankle anatomy',
      bodyParts: ['ankle', 'foot']
    },
    {
      keywords: ['wrist', 'hand', 'finger', 'carpal', 'forearm', 'elbow', 'radius', 'ulna'],
      confidence: 0.8,
      reasoning: 'Hand and wrist anatomy',
      bodyParts: ['hand', 'wrist', 'forearm']
    },
    {
      keywords: ['muscle', 'strain', 'spasm', 'tension', 'muscular', 'myalgia'],
      confidence: 0.6,
      reasoning: 'Muscular system',
      bodyParts: ['muscles']
    },
    {
      keywords: ['heart', 'cardiac', 'chest', 'cardiovascular', 'circulation', 'thorax'],
      confidence: 0.7,
      reasoning: 'Cardiovascular system',
      bodyParts: ['heart', 'chest']
    }
  ];

  // Find the best matching model from available models
  let bestScore = 0;
  let bestRule = null;
  
  for (const rule of matchingRules) {
    const matchedKeywords = rule.keywords.filter(keyword => allText.includes(keyword));
    const score = matchedKeywords.length / rule.keywords.length;
    
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (bestRule && bestScore > 0) {
    console.log(`[Fallback Matcher] Matched rule: ${bestRule.reasoning} (score: ${bestScore})`);
    
    // Find the best model from available models based on keywords
    let foundModel = null;
    let modelScore = 0;
    
    for (const model of availableModels) {
      const modelKeywords = [
        ...(model.keywords || []),
        ...(model.systems || []),
        ...(model.regions || []),
        ...(model.tags || []),
        (model.name || '').toLowerCase(),
        (model.description || '').toLowerCase(),
        (model.id || '').toLowerCase()
      ].join(' ').toLowerCase();
      
      const ruleMatches = bestRule.keywords.filter(keyword => modelKeywords.includes(keyword)).length;
      const currentScore = ruleMatches / bestRule.keywords.length;
      
      if (currentScore > modelScore) {
        modelScore = currentScore;
        foundModel = model;
      }
    }
    
    if (foundModel && modelScore > 0.1) { // At least 10% keyword match
      bestMatch = foundModel;
      confidence = bestRule.confidence * Math.min(1, bestScore * 2); // Scale confidence by match quality
      reasoning = bestRule.reasoning;
      relevantBodyParts = bestRule.bodyParts;
      console.log(`[Fallback Matcher] Selected model: ${foundModel.name} (${foundModel.id}) with score ${modelScore}`);
    } else {
      console.log(`[Fallback Matcher] No good model match found, using default`);
    }
  } else {
    console.log(`[Fallback Matcher] No rule matched, using default model`);
  }

  // Ensure we have a valid model
  if (!bestMatch || !bestMatch.id) {
    bestMatch = availableModels[0] || BIODIGITAL_MODELS[0];
    confidence = 0.3;
    reasoning = 'General anatomy model';
    relevantBodyParts = ['general'];
  }

  return {
    model: {
      id: bestMatch.id,
      name: bestMatch.name || bestMatch.id,
      description: bestMatch.description || 'BioDigital 3D anatomical model',
      thumbnail: bestMatch.thumbnail,
      systems: bestMatch.systems || bestMatch.bodyRegions || [],
      regions: bestMatch.regions || bestMatch.bodyRegions || [],
      tags: bestMatch.tags || bestMatch.keywords || [],
      keywords: bestMatch.keywords || [],
      type: 'model' as const,
      viewerUrl: bestMatch.viewerUrl || bestMatch.url || `https://human.biodigital.com/viewer/?id=${bestMatch.id}&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=true&ui-chapter-list=false&ui-fullscreen=true&ui-help=true&ui-info=true&ui-label-list=true&ui-layers=true&ui-skin-layers=true&ui-loader=circle&ui-media-controls=full&ui-menu=true&ui-nav=true&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=true&initial.none=true&disable-scroll=false&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0&paid=o_0866e6f1`
    },
    confidence,
    reasoning,
    relevantBodyParts
  };
}

/**
 * Gets the viewer URL for a matched model
 */
export function getModelViewerUrl(modelId: string): string {
  const model = BIODIGITAL_MODELS.find(m => m.id === modelId);
  return model?.url || 'https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true';
}

/**
 * Formats the model match for display in the UI
 */
export function formatModelMatch(match: ModelMatch): {
  title: string;
  description: string;
  confidence: string;
  relevantAreas: string;
} {
  return {
    title: match.model.name,
    description: match.reasoning,
    confidence: `${Math.round(match.confidence * 100)}%`,
    relevantAreas: match.relevantBodyParts.join(', ')
  };
}
