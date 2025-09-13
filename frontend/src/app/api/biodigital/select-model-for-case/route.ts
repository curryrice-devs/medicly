import { NextRequest, NextResponse } from 'next/server'

interface ModelSelectionRequest {
  caseDescription: string
  bodyPart?: string
  injuryType?: string
  aiAnalysis?: string
  sessionId?: string // Optional session ID to save URLs
  isExercisePreview?: boolean // Whether this is for exercise preview
}

export async function POST(request: NextRequest) {
  try {
    const body: ModelSelectionRequest = await request.json()
    const { caseDescription, bodyPart, injuryType, aiAnalysis, sessionId, isExercisePreview } = body

    if (!caseDescription) {
      return NextResponse.json(
        { error: 'Case description is required' }, 
        { status: 400 }
      )
    }

    // Check if we already have cached URLs for this session
    if (sessionId) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('affected_model, exercise_models')
          .eq('id', sessionId)
          .single()

        if (!sessionError && sessionData) {
          // Check if we have the appropriate cached URL
          const hasAffectedModel = sessionData.affected_model && !isExercisePreview
          const hasExerciseModels = sessionData.exercise_models && isExercisePreview

          if (hasAffectedModel || hasExerciseModels) {
            console.log('📦 Using cached BioDigital URLs, skipping AI matching')
            
            if (isExercisePreview && sessionData.exercise_models) {
              // Return first exercise model URL
              const exerciseUrls = sessionData.exercise_models.split(',')
              const modelId = exerciseUrls[0]?.match(/be=([^&]+)/)?.[1] || 'cached'
              
              return NextResponse.json({
                selectedModelId: modelId,
                selectedModel: { 
                  id: modelId, 
                  viewerUrl: exerciseUrls[0],
                  name: 'Cached Exercise Model'
                },
                confidence: 1.0,
                reasoning: 'Using cached exercise model URL',
                alternativeModels: [],
                totalAvailableModels: 1
              })
            } else if (!isExercisePreview && sessionData.affected_model) {
              // Return affected model URL
              const modelId = sessionData.affected_model.match(/be=([^&]+)/)?.[1] || 'cached'
              
              return NextResponse.json({
                selectedModelId: modelId,
                selectedModel: { 
                  id: modelId, 
                  viewerUrl: sessionData.affected_model,
                  name: 'Cached Affected Model'
                },
                confidence: 1.0,
                reasoning: 'Using cached affected model URL',
                alternativeModels: [],
                totalAvailableModels: 1
              })
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error checking cached URLs, proceeding with AI matching:', error)
      }
    }

    // First, get all available models from your library
    const modelsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/biodigital/models/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!modelsResponse.ok) {
      throw new Error('Failed to fetch available models')
    }

    const modelsData = await modelsResponse.json()
    const availableModels = modelsData.models || []

    console.log(`🎯 Selecting model for case with ${availableModels.length} available models`)
    console.log(`📋 Case: "${caseDescription}"`)
    console.log(`🎯 Body Part: "${bodyPart || 'Not specified'}"`)
    console.log(`🔍 Injury Type: "${injuryType || 'Not specified'}"`)

    // Create a comprehensive analysis prompt
    const analysisPrompt = `
You are a medical visualization expert. Analyze this case and select the BEST BioDigital 3D model to visualize the patient's condition.

CASE DETAILS:
- Description: "${caseDescription}"
- Body Part: "${bodyPart || 'Not specified'}"
- Injury Type: "${injuryType || 'Not specified'}"
- AI Analysis: "${aiAnalysis || 'Not provided'}"

AVAILABLE MODELS (select from these EXACT IDs):
${availableModels.slice(0, 20).map((model: any, index: number) => `
${index + 1}. ID: "${model.id}"
   Name: "${model.name || model.id}"
   Description: "${model.description || 'BioDigital anatomical model'}"
   Systems: ${(model.systems || []).join(', ') || 'Not specified'}
   Keywords: ${(model.keywords || model.tags || []).join(', ') || 'Not specified'}
`).join('')}

INSTRUCTIONS:
1. Focus on models that best show the affected anatomy for this case
2. For "knee and lower back strain" - prioritize models showing spine, pelvis, or lower limb systems
3. For squat-related issues - consider muscular or skeletal models of legs/spine
4. Choose the most anatomically relevant model ID from the list above

Respond in this EXACT JSON format:
{
  "selectedModelId": "exact_model_id_from_list",
  "confidence": 0.95,
  "reasoning": "Why this model is best for visualizing knee and back strain during squatting",
  "alternativeModels": ["backup_model_id_1", "backup_model_id_2"]
}
`

    // Simple prompt to match case to best model
    const claudePrompt = `Match this case to the best BioDigital model:

CASE: "${caseDescription}"

AVAILABLE MODELS:
${availableModels.slice(0, 15).map((model: any) => `"${model.id}" - ${model.name || model.id}`).join('\n')}

Find the model that best matches the case. For "squat" issues, look for "Squat", "Back Pain", "Knee", or "Hip" models.

Respond with JSON:
{
  "selectedModelId": "model_id",
  "selectedModelUrl": "https://human.biodigital.com/viewer/?be=model_id&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0",
  "confidence": 0.9,
  "reasoning": "Brief reason"
}`

    // Use Claude AI to match case to model
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    let selectedModel = null;
    let reasoning = "No AI analysis available";
    let confidence = 0.0;

    if (anthropicApiKey) {
      try {
        // Use Claude AI for intelligent selection
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: anthropicApiKey });

        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 200,
          temperature: 0.1,
          messages: [{ role: 'user', content: claudePrompt }]
        });

        const claudeResponse = response.content[0];
        if (claudeResponse.type === 'text') {
          let responseText = claudeResponse.text.trim();
          
          // Extract JSON from Claude's response (sometimes Claude adds extra text)
          const jsonStart = responseText.indexOf('{');
          const jsonEnd = responseText.lastIndexOf('}') + 1;
          
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonText = responseText.substring(jsonStart, jsonEnd);
            console.log('🤖 Claude raw response:', responseText.substring(0, 200) + '...');
            console.log('🔍 Extracted JSON:', jsonText);
            
            // Clean the JSON text to handle control characters
            const cleanedJsonText = jsonText
              .replace(/[\r\n\t]/g, ' ') // Replace newlines and tabs with spaces
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .trim();
            
            const result = JSON.parse(cleanedJsonText);
            const foundModel = availableModels.find((m: any) => m.id === result.selectedModelId);
            if (foundModel) {
              selectedModel = foundModel;
              reasoning = result.reasoning;
              confidence = result.confidence;
              console.log('🤖 Claude AI selected model:', result.selectedModelId);
            } else {
              console.warn('⚠️ Claude selected unknown model:', result.selectedModelId);
              throw new Error('Selected model not found in available models');
            }
          } else {
            console.warn('⚠️ No valid JSON found in Claude response');
            throw new Error('No valid JSON in Claude response');
          }
        }
      } catch (error) {
        console.warn('⚠️ Claude AI selection failed, using full body placeholder:', error);
        // Use Male Complete Anatomy as fallback when Claude fails
        const fallbackModel = availableModels.find((m: any) => m.id === '6Pze') || availableModels[0];
        selectedModel = fallbackModel;
        reasoning = "Claude AI failed - using Male Complete Anatomy as placeholder";
        confidence = 0.3;
      }
    } else {
      console.warn('⚠️ No Anthropic API key configured, using full body placeholder');
      // No API key, return error
      return NextResponse.json(
        { 
          error: 'Claude AI API key required',
          selectedModelId: null,
          confidence: 0.0,
          reasoning: 'No AI analysis available'
        }, 
        { status: 400 }
      )
    }

    console.log(`✅ Selected model: ${selectedModel.id} (${selectedModel.name})`)
    console.log(`📝 Reasoning: ${reasoning}`)

    // Save URLs to database if sessionId is provided
    if (sessionId) {
      try {
        const modelUrl = selectedModel.viewerUrl || `https://human.biodigital.com/viewer/?be=${selectedModel.id}&dk=${process.env.NEXT_PUBLIC_BIODIGITAL_KEY}`
        
        // Determine which URLs to save based on the request type
        let affectedModelUrl = null
        let exerciseModelUrls = null
        
        if (isExercisePreview) {
          // For exercise previews, save to exercise_models
          exerciseModelUrls = [modelUrl]
        } else {
          // For main viewer, save to affected_model
          affectedModelUrl = modelUrl
        }
        
        const saveResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/biodigital/save-model-urls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            affectedModelUrl,
            exerciseModelUrls
          })
        })

        if (saveResponse.ok) {
          console.log('💾 Successfully saved BioDigital URLs to database')
        } else {
          console.warn('⚠️ Failed to save BioDigital URLs to database')
        }
      } catch (error) {
        console.error('❌ Error saving BioDigital URLs:', error)
      }
    }

    return NextResponse.json({
      selectedModelId: selectedModel.id,
      selectedModel: selectedModel,
      confidence: confidence,
      reasoning: reasoning,
      alternativeModels: availableModels.slice(1, 4).map((m: any) => m.id),
      totalAvailableModels: availableModels.length
    })

  } catch (error) {
    console.error('❌ Model selection failed:', error)
    return NextResponse.json(
      { 
        error: 'Model selection failed',
        selectedModelId: null,
        confidence: 0.0,
        reasoning: 'Failed to select model'
      }, 
      { status: 500 }
    )
  }
}
