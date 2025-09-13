import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

interface ModelMatchRequest {
  prompt: string;
  availableModels: any[];
  patientData: {
    patientSummary: string;
    bodyPart?: string;
    injuryType?: string;
    painIndicators?: Array<{
      location: string;
      severity: number;
      type: string;
      triggers: string[];
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      console.warn('[biodigital/match-model] Missing Anthropic API key - using fallback matching');
      
      // Return a fallback response that will trigger rule-based matching
      return NextResponse.json(
        { 
          error: 'AI service not configured - using fallback matching',
          useFallback: true 
        }, 
        { status: 503 } // Service Unavailable - indicates fallback should be used
      );
    }

    const body: ModelMatchRequest = await request.json();
    const { prompt, availableModels, patientData } = body;

    if (!prompt || !availableModels || !patientData) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    // Create enhanced prompt with available models
    const enhancedPrompt = `${prompt}

AVAILABLE MODELS:
${availableModels.slice(0, 50).map((model, index) => `
${index + 1}. ID: ${model.id}
   Name: ${model.name || model.id}
   Description: ${model.description || 'BioDigital anatomical model'}
   Systems: ${(model.systems || model.bodyRegions || []).join(', ') || 'Not specified'}
   Keywords: ${(model.keywords || model.tags || []).join(', ') || 'Not specified'}
   Type: ${model.type || 'model'}
`).join('')}

IMPORTANT: You must select from the models listed above. Use the exact model ID in your response.
Note: Only the first 50 models are shown for analysis efficiency.
`;

    // Call Claude to analyze and match
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: enhancedPrompt
        }
      ]
    });

    // Parse Claude's response
    const claudeResponse = response.content[0];
    if (claudeResponse.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let analysisResult;
    try {
      // Extract JSON from Claude's response
      const jsonMatch = claudeResponse.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[biodigital/match-model] Failed to parse Claude response:', parseError);
      throw new Error('Failed to parse AI analysis');
    }

    // Validate the response
    if (!analysisResult.selectedModelId || !analysisResult.confidence) {
      throw new Error('Invalid AI analysis response format');
    }

    // Find the selected model
    const selectedModel = availableModels.find(m => m.id === analysisResult.selectedModelId);
    if (!selectedModel) {
      throw new Error(`Selected model ID not found: ${analysisResult.selectedModelId}`);
    }

    // Format the response
    const match = {
      model: {
        id: selectedModel.id,
        name: selectedModel.name || selectedModel.id,
        description: selectedModel.description || 'BioDigital 3D anatomical model',
        thumbnail: selectedModel.thumbnail,
        systems: selectedModel.systems || selectedModel.bodyRegions || [],
        regions: selectedModel.regions || selectedModel.bodyRegions || [],
        tags: selectedModel.tags || selectedModel.keywords || [],
        keywords: selectedModel.keywords || [],
        type: 'model' as const,
        viewerUrl: selectedModel.viewerUrl || selectedModel.url || `https://human.biodigital.com/viewer/?id=${selectedModel.id}&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=true&ui-chapter-list=false&ui-fullscreen=true&ui-help=true&ui-info=true&ui-label-list=true&ui-layers=true&ui-skin-layers=true&ui-loader=circle&ui-media-controls=full&ui-menu=true&ui-nav=true&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=true&initial.none=true&disable-scroll=false&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0&paid=o_0866e6f1`
      },
      confidence: analysisResult.confidence,
      reasoning: 'Selected by AI analysis',
      relevantBodyParts: [patientData.bodyPart || 'unknown']
    };

    return NextResponse.json({ 
      match,
      rawAnalysis: analysisResult 
    });

  } catch (error) {
    console.error('[biodigital/match-model] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to match model',
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}
