'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2, Eye, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mapPatientPainToBioDigitalModels } from '@/lib/biodigital-model-lookup'
import { 
  fetchMyBioDigitalModels, 
  buildModelIndex, 
  mapPatientTextToModels,
  getCachedModelData,
  cacheModelData,
  type BioDigitalAPIModel 
} from '@/lib/biodigital-api'
import { biodigitalModelManager, type PatientModelMatch } from '@/lib/biodigital-model-manager'

interface ProblematicArea {
  id: string
  name: string
  severity: 'low' | 'medium' | 'high'
  description: string
  color: { r: number; g: number; b: number }
  opacity: number
}

interface BioDigitalViewerProps {
  problematicAreas: ProblematicArea[]
  patientId: string
  patientInfo?: {
    name: string
    age: number
    gender: string
    injuryType: string
  }
}

// Model definitions with their anatomy coverage
const BIODIGITAL_MODELS = {
  'production/maleAdult/skeleton': {
    name: 'Full Skeleton',
    coverage: ['skull', 'spine', 'ribs', 'pelvis', 'femur', 'tibia', 'fibula', 'humerus', 'radius', 'ulna', 'clavicle', 'scapula'],
    bodyRegions: ['head', 'torso', 'arms', 'legs', 'spine']
  },
  'production/maleAdult/muscular': {
    name: 'Muscular System',
    coverage: ['deltoid', 'biceps', 'triceps', 'pectorals', 'latissimus', 'erector_spinae', 'quadriceps', 'hamstrings', 'glutes', 'calves'],
    bodyRegions: ['arms', 'torso', 'legs', 'back']
  },
  'production/maleAdult/cardiovascular': {
    name: 'Cardiovascular System',
    coverage: ['heart', 'aorta', 'arteries', 'veins', 'capillaries'],
    bodyRegions: ['torso', 'chest']
  },
  'production/maleAdult/lower_limb_codepen': {
    name: 'Lower Limb',
    coverage: ['femur', 'tibia', 'fibula', 'patella', 'hip', 'knee', 'ankle', 'foot', 'thigh', 'calf'],
    bodyRegions: ['legs', 'hips', 'feet']
  },
  'production/maleAdult/upper_limb': {
    name: 'Upper Limb',
    coverage: ['humerus', 'radius', 'ulna', 'clavicle', 'scapula', 'shoulder', 'elbow', 'wrist', 'hand'],
    bodyRegions: ['arms', 'shoulders', 'hands']
  },
  'production/maleAdult/spine': {
    name: 'Spine',
    coverage: ['cervical', 'thoracic', 'lumbar', 'sacrum', 'coccyx', 'vertebrae', 'discs'],
    bodyRegions: ['spine', 'back', 'neck']
  }
}

export function BioDigitalViewer({ problematicAreas, patientId, patientInfo }: BioDigitalViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [viewerReady, setViewerReady] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [availableObjects, setAvailableObjects] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [modelSelectionReason, setModelSelectionReason] = useState<string>('')
  const [claudeAnalysis, setClaudeAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [apiModels, setApiModels] = useState<BioDigitalAPIModel[]>([])
  const [modelIndex, setModelIndex] = useState<Record<string, BioDigitalAPIModel>>({})
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [contentApiModels, setContentApiModels] = useState<PatientModelMatch[]>([])
  const [isLoadingContentApi, setIsLoadingContentApi] = useState(false)

  // Get BioDigital keys from environment
  const biodigitalKey = process.env.NEXT_PUBLIC_BIODIGITAL_KEY || 'YOUR_APP_KEY'
  const biodigitalDevKey = process.env.NEXT_PUBLIC_BIODIGITAL_DEVELOPER_KEY || 'YOUR_DEVELOPER_KEY'
  const biodigitalDevSecret = process.env.NEXT_PUBLIC_BIODIGITAL_DEVELOPER_SECRET || 'YOUR_DEVELOPER_SECRET'
  
  console.log('🔑 BioDigital Key from env:', biodigitalKey ? `${biodigitalKey.substring(0, 8)}...` : 'undefined')
  console.log('🔑 BioDigital Dev Key from env:', biodigitalDevKey ? `${biodigitalDevKey.substring(0, 8)}...` : 'undefined')
  console.log('🧪 Testing Library Model 6PxO for selectedModel:', selectedModel)

  // Function to load models using comprehensive Content API
  const loadContentApiModels = async () => {
    if (!problematicAreas || problematicAreas.length === 0) return;
    
    setIsLoadingContentApi(true);
    try {
      console.log('🚀 Loading models via comprehensive Content API...');
      
      // Extract patient area descriptions
      const patientAreas = problematicAreas.map(area => 
        `${area.name} ${area.description || ''}`
      );
      
      // Use the model manager to find matches
      const matches = await biodigitalModelManager.findMatchingModels(patientAreas);
      
      if (matches.length > 0) {
        console.log(`✅ Found ${matches.length} matching models from Content API`);
        setContentApiModels(matches);
        
        // Use the best match
        const bestMatch = matches[0];
        setSelectedModel(bestMatch.model.id);
        setModelSelectionReason(`Content API: ${bestMatch.reasons.join(', ')} (${Math.round(bestMatch.confidence * 100)}% confidence)`);
        setClaudeAnalysis({
          recommended_model: bestMatch.model.id,
          confidence_score: bestMatch.confidence,
          reasoning: bestMatch.reasons,
          matched_keywords: bestMatch.matchedKeywords
        });
      } else {
        console.log('ℹ️ No Content API matches found, falling back to legacy system');
        // Fall back to existing system
        await loadBioDigitalModels();
      }
      
    } catch (error) {
      console.warn('⚠️ Content API failed, falling back to legacy system:', error);
      await loadBioDigitalModels();
    } finally {
      setIsLoadingContentApi(false);
    }
  };

  // Function to load models from BioDigital API (legacy)
  const loadBioDigitalModels = async () => {
    setIsLoadingModels(true)
    try {
      // First try to get cached models
      const cachedModels = getCachedModelData()
      if (cachedModels && cachedModels.length > 0) {
        console.log('📦 Using cached BioDigital models:', cachedModels.length)
        setApiModels(cachedModels)
        setModelIndex(buildModelIndex(cachedModels))
        return
      }

      // Check if we have valid API credentials
      if (biodigitalDevKey === 'YOUR_APP_KEY' || !biodigitalDevKey || 
          biodigitalDevSecret === 'YOUR_APP_KEY' || !biodigitalDevSecret) {
        console.log('⚠️ No valid BioDigital API credentials, using fallback models')
        return
      }

      // Fetch from API using OAuth
      console.log('🌐 Fetching models from BioDigital API with OAuth...')
      const models = await fetchMyBioDigitalModels(biodigitalDevKey)
      
      if (models.length > 0) {
        console.log('✅ Fetched models from BioDigital API:', models.length)
        setApiModels(models)
        setModelIndex(buildModelIndex(models))
        // Cache the models
        cacheModelData(models)
      } else {
        console.log('ℹ️ No models returned from BioDigital API, using fallback models')
      }
      
    } catch (error) {
      console.warn('⚠️ BioDigital API failed, using fallback models:', error)
      // Continue with fallback models
    } finally {
      setIsLoadingModels(false)
    }
  }

  // Function to analyze patient with API models or local logic
  const analyzeWithClaude = async (areas: ProblematicArea[], patientInfo: any) => {
    setIsAnalyzing(true)
    
    try {
      console.log('🤖 Analyzing patient...', { areas, patientInfo })
      
      // If we have API models, use them
      if (apiModels.length > 0) {
        const patientText = areas.map(area => `${area.name} ${area.id}`).join(' ')
        const apiResults = mapPatientTextToModels(patientText, modelIndex)
        
        if (apiResults.length > 0) {
          const bestMatch = apiResults[0]
          setSelectedModel(bestMatch.model.id)
          setModelSelectionReason(`API Match: ${bestMatch.reasoning} (${(bestMatch.confidence * 100).toFixed(1)}% confidence)`)
          
          setClaudeAnalysis({
            recommended_model: bestMatch.model.id,
            model_name: bestMatch.model.name,
            confidence_score: bestMatch.confidence,
            reasoning: bestMatch.reasoning,
            all_matches: apiResults
          })
          
          console.log('🎯 API Analysis result:', bestMatch)
          return
        }
      }
      
      // Fallback to local analysis
      const analysis = analyzePatientLocally(areas, patientInfo)
      setClaudeAnalysis(analysis)
      setSelectedModel(analysis.recommended_model)
      setModelSelectionReason(analysis.reasoning)
      
      console.log('🎯 Local Analysis result:', analysis)
      console.log('🏃 Recommended movements:', analysis.recommended_movements)
      
    } catch (error) {
      console.error('❌ Analysis error:', error)
      // Fallback to simple model selection
      const fallback = selectBestModelFallback(areas)
      setSelectedModel(fallback.modelId)
      setModelSelectionReason(`Fallback: ${fallback.reason}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // BioDigital Models Database
  const BIODIGITAL_MODELS = [
    {
      id: "production/maleAdult/skeleton",
      name: "Full Skeleton System",
      description: "Complete skeletal system including all bones and joints",
      bodyRegions: ["full_body", "skeleton", "bones"],
      keywords: ["skeleton", "bones", "skeletal", "full_body", "complete"]
    },
    {
      id: "production/maleAdult/muscular",
      name: "Muscular System",
      description: "Complete muscular system including all major muscle groups",
      bodyRegions: ["full_body", "muscles", "muscular"],
      keywords: ["muscles", "muscular", "muscle_groups", "full_body"]
    },
    {
      id: "production/maleAdult/cardiovascular",
      name: "Cardiovascular System",
      description: "Heart and circulatory system",
      bodyRegions: ["heart", "chest", "cardiovascular"],
      keywords: ["heart", "cardiac", "cardiovascular", "circulation", "chest"]
    },
    {
      id: "production/maleAdult/lower_limb_codepen",
      name: "Lower Limb System",
      description: "Hips, legs, knees, ankles, and feet",
      bodyRegions: ["hips", "legs", "knees", "ankles", "feet", "lower_limb"],
      keywords: ["hip", "leg", "knee", "ankle", "foot", "thigh", "calf", "shin", "lower_limb", "pelvis", "femur", "tibia", "fibula", "patella"]
    },
    {
      id: "production/maleAdult/upper_limb",
      name: "Upper Limb System",
      description: "Shoulders, arms, hands, wrists, and elbows",
      bodyRegions: ["shoulders", "arms", "hands", "wrists", "elbows", "upper_limb"],
      keywords: ["shoulder", "arm", "hand", "wrist", "elbow", "upper_limb", "deltoid", "biceps", "triceps", "forearm", "humerus", "radius", "ulna"]
    },
    {
      id: "production/maleAdult/spine",
      name: "Spine System",
      description: "Cervical, thoracic, and lumbar spine",
      bodyRegions: ["spine", "back", "cervical", "thoracic", "lumbar"],
      keywords: ["spine", "back", "cervical", "thoracic", "lumbar", "vertebrae", "spinal", "erector_spinae", "lumbar_vertebrae"]
    },
    {
      id: "production/maleAdult/shoulder_complex",
      name: "Shoulder Complex",
      description: "Detailed shoulder anatomy including rotator cuff",
      bodyRegions: ["shoulder", "rotator_cuff"],
      keywords: ["shoulder", "rotator_cuff", "deltoid", "supraspinatus", "infraspinatus", "subscapularis", "teres_minor", "shoulder_pain", "shoulder_impingement"]
    },
    {
      id: "production/maleAdult/knee_complex",
      name: "Knee Complex",
      description: "Detailed knee anatomy including ligaments and menisci",
      bodyRegions: ["knee", "patella"],
      keywords: ["knee", "patella", "meniscus", "acl", "pcl", "mcl", "lcl", "knee_pain", "knee_injury"]
    },
    {
      id: "production/maleAdult/hip_complex",
      name: "Hip Complex",
      description: "Detailed hip anatomy including joint and surrounding muscles",
      bodyRegions: ["hip", "pelvis"],
      keywords: ["hip", "pelvis", "femur", "hip_joint", "hip_pain", "hip_flexor", "glutes"]
    },
    {
      id: "production/maleAdult/ankle_foot",
      name: "Ankle and Foot",
      description: "Detailed ankle and foot anatomy",
      bodyRegions: ["ankle", "foot"],
      keywords: ["ankle", "foot", "tibia", "fibula", "talus", "calcaneus", "ankle_pain", "foot_pain"]
    }
  ]

  // Use the comprehensive BioDigital lookup system
  const biodigitalMapping = BIODIGITAL_MODELS.reduce((acc, model) => {
    model.keywords.forEach(keyword => {
      acc[keyword] = {
        model: model.id,
        objectIds: model.bodyRegions,
        description: model.description
      }
    })
    return acc
  }, {} as Record<string, { model: string; objectIds: string[]; description: string }>)

  // Function to map patient text to BioDigital model using improved logic
  const mapPatientTextToBioDigital = (areas: ProblematicArea[], patientInfo: any) => {
    console.log('🔍 Mapping patient areas to BioDigital models:', areas)
    console.log('📋 Available mappings:', Object.keys(biodigitalMapping))
    
    const results = areas.map(area => {
      const areaText = `${area.name} ${area.id}`.toLowerCase()
      console.log(`📝 Processing area: "${areaText}"`)
      
      // Find best match in mapping table
      let bestMatch: {key: string; mapping: any; reasons: string[]} | null = null
      let bestScore = 0
      let allMatches: Array<{key: string; mapping: any; score: number; reasons: string[]}> = []
      
      Object.entries(biodigitalMapping).forEach(([key, mapping]) => {
        const keyWords = key.toLowerCase().split('_')
        let score = 0
        let matchReasons = []
        
        // Check for exact key match (highest priority)
        if (areaText.includes(key.toLowerCase())) {
          score += 20
          matchReasons.push(`Exact key match: "${key}"`)
        }
        
        // Check if any key words match the area text
        keyWords.forEach(keyWord => {
          if (areaText.includes(keyWord)) {
            score += keyWord.length * 2 // Longer matches get higher scores
            matchReasons.push(`Word match: "${keyWord}"`)
          }
        })
        
        // Check for partial matches in area name
        if (area.name.toLowerCase().includes(key.toLowerCase())) {
          score += 10
          matchReasons.push(`Name contains key: "${key}"`)
        }
        
        // Check for partial matches in area ID
        if (area.id.toLowerCase().includes(key.toLowerCase())) {
          score += 15
          matchReasons.push(`ID contains key: "${key}"`)
        }
        
        allMatches.push({
          key,
          mapping,
          score,
          reasons: matchReasons
        })
        
        if (score > bestScore) {
          bestScore = score
          bestMatch = { key, mapping, reasons: matchReasons }
        }
      })
      
      // Sort all matches by score for debugging
      allMatches.sort((a, b) => b.score - a.score)
      console.log(`🔍 All matches for "${areaText}":`, allMatches.slice(0, 3))
      
      if (bestMatch && bestScore > 0) {
        const match = bestMatch as any
        console.log(`✅ Mapped "${areaText}" to ${match.key} -> ${match.mapping.model}`)
        console.log(`📊 Score: ${bestScore}, Reasons:`, match.reasons)
        return {
          pain_area: area.name,
          model: match.mapping.model,
          objectIds: match.mapping.objectIds,
          confidence: Math.min(bestScore / 20, 1.0),
          reasoning: `Mapped "${area.name}" to ${match.key} (${match.mapping.description})`,
          mapping_key: match.key,
          score: bestScore
        }
      } else {
        console.log(`❌ No mapping found for "${areaText}"`)
        return {
          pain_area: area.name,
          model: "production/maleAdult/skeleton",
          objectIds: [],
          confidence: 0.0,
          reasoning: `No specific mapping found for "${area.name}", using default skeleton model`,
          mapping_key: "default",
          score: 0
        }
      }
    })
    
    // Group by model and combine objectIds
    const modelGroups: { [key: string]: any[] } = {}
    results.forEach((result: any) => {
      if (!modelGroups[result.model]) {
        modelGroups[result.model] = []
      }
      modelGroups[result.model].push(result)
    })
    
    console.log('📊 Model groups:', modelGroups)
    
    // Find the model with the highest total confidence
    let bestModel = "production/maleAdult/skeleton"
    let bestModelScore = 0
    
    Object.entries(modelGroups).forEach(([model, groupResults]: [string, any[]]) => {
      const totalScore = groupResults.reduce((sum: number, result: any) => sum + result.score, 0)
      console.log(`📈 Model ${model}: total score ${totalScore}`)
      if (totalScore > bestModelScore) {
        bestModelScore = totalScore
        bestModel = model
      }
    })
    
    const selectedGroup = modelGroups[bestModel] || []
    const allObjectIds = [...new Set(selectedGroup.flatMap((result: any) => result.objectIds || []))]
    
    console.log(`🎯 Selected model: ${bestModel} with ${allObjectIds.length} anatomy objects`)
    
    return {
      recommended_model: bestModel,
      model_name: getModelDisplayName(bestModel),
      reasoning: `Selected ${bestModel} based on ${selectedGroup.length} mapped areas (total score: ${bestModelScore})`,
      anatomy_objects: allObjectIds.map(id => ({
        id,
        name: id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        reason: `Highlighted based on patient pain areas`
      })),
      recommended_movements: generateMovementRecommendations(bestModel, areas),
      confidence_score: Math.min(bestModelScore / (areas.length * 20), 1.0),
      mapping_results: results,
      debug_info: {
        model_groups: modelGroups,
        selected_group: selectedGroup,
        total_score: bestModelScore
      }
    }
  }

  // Helper function to get model display name
  const getModelDisplayName = (modelId: string) => {
    const modelNames: { [key: string]: string } = {
      'production/maleAdult/skeleton': 'Full Skeleton',
      'production/maleAdult/muscular': 'Muscular System',
      'production/maleAdult/lower_limb_codepen': 'Lower Limb',
      'production/maleAdult/upper_limb': 'Upper Limb',
      'production/maleAdult/spine': 'Spine',
      'production/maleAdult/cardiovascular': 'Cardiovascular System'
    }
    return modelNames[modelId] || modelId
  }

  // Helper function to generate movement recommendations
  const generateMovementRecommendations = (modelId: string, areas: ProblematicArea[]) => {
    const movementMap: { [key: string]: string[] } = {
      'production/maleAdult/muscular': ['Range of Motion', 'Muscle Strengthening', 'Flexibility Training'],
      'production/maleAdult/skeleton': ['Posture Correction', 'Joint Mobility', 'Bone Strengthening'],
      'production/maleAdult/lower_limb_codepen': ['Squats', 'Lunges', 'Leg Presses'],
      'production/maleAdult/upper_limb': ['Shoulder Raises', 'Arm Circles', 'Bicep Curls'],
      'production/maleAdult/spine': ['Spinal Flexion', 'Core Strengthening', 'Posture Exercises']
    }
    
    const movements = movementMap[modelId] || ['General Exercise', 'Range of Motion', 'Strengthening']
    
    return movements.map((movement: string, index: number) => ({
      name: movement,
      description: `Targeted exercise for ${getModelDisplayName(modelId).toLowerCase()} rehabilitation`,
      target_areas: areas.map(a => a.name),
      difficulty: ['beginner', 'intermediate', 'advanced'][index] || 'intermediate',
      purpose: `Addresses ${areas.map(a => a.name).join(', ')} issues`
    }))
  }

  // Comprehensive local analysis function
  const analyzePatientLocally = (areas: ProblematicArea[], patientInfo: any) => {
    return mapPatientTextToBioDigital(areas, patientInfo)
  }

  // Fallback function for simple model selection
  const selectBestModelFallback = (areas: ProblematicArea[]): { modelId: string; reason: string } => {
    if (areas.length === 0) {
      return { modelId: 'production/maleAdult/skeleton', reason: 'No specific areas - using full skeleton' }
    }

    // Simple keyword matching as fallback
    const areaKeywords = areas.map(area => area.id.toLowerCase()).join(' ')
    
    if (areaKeywords.includes('spine') || areaKeywords.includes('lumbar') || areaKeywords.includes('vertebrae')) {
      return { modelId: 'production/maleAdult/spine', reason: 'Spine-related issues detected' }
    } else if (areaKeywords.includes('deltoid') || areaKeywords.includes('biceps') || areaKeywords.includes('shoulder') || areaKeywords.includes('arm')) {
      return { modelId: 'production/maleAdult/upper_limb', reason: 'Upper limb issues detected' }
    } else if (areaKeywords.includes('femur') || areaKeywords.includes('tibia') || areaKeywords.includes('patella') || areaKeywords.includes('knee') || areaKeywords.includes('leg')) {
      return { modelId: 'production/maleAdult/lower_limb_codepen', reason: 'Lower limb issues detected' }
    } else {
      return { modelId: 'production/maleAdult/skeleton', reason: 'General skeletal issues - using full skeleton' }
    }
  }

  useEffect(() => {
    // Try comprehensive Content API first, fall back to legacy
    loadContentApiModels()
  }, [])

  useEffect(() => {
    // Analyze with Claude AI after models are loaded
    if (problematicAreas.length > 0) {
      const info = patientInfo || {
        id: patientId,
        name: `Patient ${patientId}`,
        age: 35,
        gender: 'Unknown',
        injuryType: 'Physical Therapy'
      }
      
      analyzeWithClaude(problematicAreas, info)
    } else {
      // No problematic areas, use fallback
      const fallback = selectBestModelFallback(problematicAreas)
      setSelectedModel(fallback.modelId)
      setModelSelectionReason(fallback.reason)
    }
  }, [apiModels, problematicAreas, patientInfo])

  useEffect(() => {
    // Check if we have a valid API key
    if (biodigitalKey === 'YOUR_APP_KEY' || !biodigitalKey) {
      setIsLoading(false)
      setUseFallback(true)
      return
    }

    // Load BioDigital scripts
    const loadScripts = () => {
      // Check if we're in the browser
      if (typeof window === 'undefined') return
      
      // Load jQuery (using the exact version from the sample)
      if (!window.jQuery) {
        const jqueryScript = document.createElement('script')
        jqueryScript.src = 'https://code.jquery.com/jquery-1.12.4.min.js'
        jqueryScript.onload = () => {
          // Load HumanAPI
          const humanApiScript = document.createElement('script')
          humanApiScript.src = 'https://developer.biodigital.com/builds/api/human-api-3.0.0.min.js'
          humanApiScript.onload = () => {
            // Load Human Components (using the non-minified version from the sample)
            const componentsScript = document.createElement('script')
            componentsScript.src = 'https://developer.biodigital.com/builds/human-components/1.0.0/js/human-components.js'
            componentsScript.onload = () => {
              setIsReady(true)
            }
            componentsScript.onerror = () => setError('Failed to load BioDigital components')
            document.head.appendChild(componentsScript)
          }
          humanApiScript.onerror = () => setError('Failed to load HumanAPI')
          document.head.appendChild(humanApiScript)
        }
        jqueryScript.onerror = () => setError('Failed to load jQuery')
        document.head.appendChild(jqueryScript)
      } else {
        setIsReady(true)
      }
    }

    loadScripts()
  }, [])

  useEffect(() => {
    if (!isReady || !iframeRef.current) return

    const iframe = iframeRef.current
    const handleLoad = () => {
      setIsLoading(false)
      setViewerReady(true)
      
      // Wait a bit for the iframe to fully initialize
      setTimeout(() => {
        highlightProblematicAreas()
      }, 2000)
    }

  const handleError = () => {
    setIsLoading(false)
    setError('Failed to load BioDigital viewer, using fallback')
    setUseFallback(true)
  }

    iframe.addEventListener('load', handleLoad)
    iframe.addEventListener('error', handleError)

    return () => {
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
    }
  }, [isReady])

  const highlightProblematicAreas = () => {
    if (!window.HumanAPI || !viewerReady) return

    try {
      // Wait for HumanAPI to be ready
      window.HumanAPI.on('ready', () => {
        // First, get all available anatomy objects for debugging
        window.HumanAPI.send('scene.getAnatomyObjects', {}, (objects: any) => {
          console.log('Available Anatomy Objects:', objects)
          
          // Try to find matching objects for our problematic areas
          const availableObjects = objects || []
          const objectNames = availableObjects.map((obj: any) => obj.name || obj.id).join(', ')
          console.log('Available object names:', objectNames)
          
          // Map our problematic areas to available objects
          problematicAreas.forEach((area, index) => {
            // Try to find a matching object
            let targetObjectId = area.id
            
            // Common mappings for anatomy objects
            const objectMappings: { [key: string]: string[] } = {
              // Lower limb anatomy
              'femur_right': ['femur', 'thigh', 'leg', 'upper_leg'],
              'femur_left': ['femur', 'thigh', 'leg', 'upper_leg'],
              'tibia_right': ['tibia', 'shin', 'leg', 'lower_leg'],
              'tibia_left': ['tibia', 'shin', 'leg', 'lower_leg'],
              'fibula_right': ['fibula', 'leg', 'lower_leg'],
              'fibula_left': ['fibula', 'leg', 'lower_leg'],
              'patella_right': ['patella', 'knee', 'kneecap'],
              'patella_left': ['patella', 'knee', 'kneecap'],
              'hip_joint_right': ['hip', 'pelvis', 'joint'],
              'hip_joint_left': ['hip', 'pelvis', 'joint'],
              'knee_joint_right': ['knee', 'joint'],
              'knee_joint_left': ['knee', 'joint'],
              'ankle_joint_right': ['ankle', 'joint'],
              'ankle_joint_left': ['ankle', 'joint'],
              // Upper body anatomy (for other models)
              'deltoid_right': ['deltoid', 'shoulder', 'arm', 'upper_arm'],
              'supraspinatus_right': ['supraspinatus', 'rotator_cuff', 'shoulder'],
              'lumbar_vertebrae': ['lumbar', 'spine', 'vertebrae', 'back'],
              'erector_spinae': ['erector_spinae', 'back_muscle', 'spine_muscle']
            }
            
            // Find the best match
            const possibleMatches = objectMappings[area.id] || [area.id]
            const matchedObject = availableObjects.find((obj: any) => {
              const objName = (obj.name || obj.id || '').toLowerCase()
              return possibleMatches.some(match => 
                objName.includes(match.toLowerCase())
              )
            })
            
            if (matchedObject) {
              targetObjectId = matchedObject.id || matchedObject.name
              console.log(`Mapped ${area.id} to ${targetObjectId}`)
            } else {
              console.warn(`Could not find matching object for ${area.id}`)
              // Try the original ID anyway
            }
            
            // Highlight the problematic area
            window.HumanAPI.send('scene.color', {
              objects: [targetObjectId],
              color: area.color,
              opacity: area.opacity
            })

            // Add a label for the area
            window.HumanAPI.send('labels.create', {
              id: `label_${area.id}_${patientId}`,
              objectId: targetObjectId,
              text: area.name,
              anchor: 'middle'
            })

            // Focus camera on the first problematic area
            if (index === 0) {
              window.HumanAPI.send('camera.focus', {
                objects: [targetObjectId],
                distance: 0.6
              })
            }
          })
        })
      })
    } catch (err) {
      console.error('Error highlighting areas:', err)
      setError('Failed to highlight problematic areas')
    }
  }

  const resetView = () => {
    if (!window.HumanAPI || !viewerReady) return

    try {
      // Reset all colors
      problematicAreas.forEach(area => {
        window.HumanAPI.send('scene.color', {
          objects: [area.id],
          color: { r: 1, g: 1, b: 1 }, // White
          opacity: 1
        })
      })

      // Remove all labels
      problematicAreas.forEach(area => {
        window.HumanAPI.send('labels.remove', {
          id: `label_${area.id}_${patientId}`
        })
      })

      // Reset camera
      window.HumanAPI.send('camera.reset')
    } catch (err) {
      console.error('Error resetting view:', err)
    }
  }

  const focusOnArea = (areaId: string) => {
    if (!window.HumanAPI || !viewerReady) return

    try {
      window.HumanAPI.send('camera.focus', {
        objects: [areaId],
        distance: 0.6
      })
    } catch (err) {
      console.error('Error focusing on area:', err)
    }
  }

  const zoomIn = () => {
    if (!window.HumanAPI || !viewerReady) return

    try {
      window.HumanAPI.send('camera.zoom', { factor: 1.2 })
    } catch (err) {
      console.error('Error zooming in:', err)
    }
  }

  const zoomOut = () => {
    if (!window.HumanAPI || !viewerReady) return

    try {
      window.HumanAPI.send('camera.zoom', { factor: 0.8 })
    } catch (err) {
      console.error('Error zooming out:', err)
    }
  }

  const debugAnatomyObjects = () => {
    if (!window.HumanAPI || !viewerReady) return

    try {
      window.HumanAPI.send('scene.getAnatomyObjects', {}, (objects: any) => {
        console.log('All Available Anatomy Objects:', objects)
        setAvailableObjects(objects || [])
        setDebugMode(true)
      })
    } catch (err) {
      console.error('Error getting anatomy objects:', err)
    }
  }

  // Fallback 3D Viewer Component
  const FallbackViewer = () => (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-indigo-200 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-200 rounded-full opacity-25 animate-pulse delay-500"></div>
        <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-cyan-200 rounded-full opacity-20 animate-pulse delay-700"></div>
      </div>
      
      {/* 3D-like human figure representation */}
      <div className="relative z-10 text-center">
        <div className="mb-6">
          <div className="w-32 h-40 mx-auto relative">
            {/* Head */}
            <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2 relative">
              <div className="absolute inset-2 bg-gray-400 rounded-full"></div>
            </div>
            
            {/* Body */}
            <div className="w-16 h-20 bg-gray-300 rounded-lg mx-auto relative">
              {/* Highlighted areas */}
              {problematicAreas.map((area, index) => {
                const colors = {
                  high: 'bg-red-400',
                  medium: 'bg-yellow-400', 
                  low: 'bg-green-400'
                }
                return (
                  <div
                    key={index}
                    className={`absolute w-6 h-6 ${colors[area.severity]} rounded-full opacity-70 animate-pulse`}
                    style={{
                      top: area.id.includes('shoulder') ? '10px' : area.id.includes('back') ? '30px' : '50px',
                      left: area.id.includes('right') ? '40px' : '10px',
                      animationDelay: `${index * 0.5}s`
                    }}
                    title={area.name}
                  />
                )
              })}
            </div>
            
            {/* Arms */}
            <div className="absolute top-4 left-0 w-8 h-16 bg-gray-300 rounded-full transform -rotate-12"></div>
            <div className="absolute top-4 right-0 w-8 h-16 bg-gray-300 rounded-full transform rotate-12"></div>
            
            {/* Legs */}
            <div className="absolute bottom-0 left-2 w-6 h-16 bg-gray-300 rounded-full"></div>
            <div className="absolute bottom-0 right-2 w-6 h-16 bg-gray-300 rounded-full"></div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">3D Anatomy Viewer</h3>
        <p className="text-sm text-gray-600 mb-4">
          Interactive 3D model with highlighted problematic areas
        </p>
        <div className="text-xs text-gray-500">
          <p>🔴 High severity areas</p>
          <p>🟡 Medium severity areas</p>
          <p>🟢 Low severity areas</p>
        </div>
      </div>
    </div>
  )

  if (error && !useFallback) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load 3D Viewer</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
            <Button onClick={() => setUseFallback(true)} variant="outline">
              Use Fallback
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (useFallback) {
    return (
      <div className="w-full">
        {/* Controls for fallback */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseFallback(false)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Try BioDigital Again
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            Using Fallback Viewer
          </div>
        </div>

        <FallbackViewer />

        {/* Problematic Areas Legend */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Problematic Areas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {problematicAreas.map((area, index) => (
              <div
                key={index}
                className="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                  style={{
                    backgroundColor: `rgb(${area.color.r * 255}, ${area.color.g * 255}, ${area.color.b * 255})`,
                    opacity: area.opacity
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{area.name}</p>
                  <p className="text-xs text-gray-600 truncate">{area.description}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  area.severity === 'high' ? 'bg-red-100 text-red-800' :
                  area.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {area.severity}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Claude Analysis Loading */}
      {isLoadingContentApi && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <div>
              <h3 className="font-medium text-purple-800">Loading Content API Models</h3>
              <p className="text-sm text-purple-600">Fetching your complete BioDigital library via Content API...</p>
            </div>
          </div>
        </div>
      )}

      {isLoadingModels && !isLoadingContentApi && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">Loading BioDigital Models (Fallback)</h3>
              <p className="text-sm text-green-600">Content API failed, using legacy system...</p>
            </div>
          </div>
        </div>
      )}

      {apiModels.length > 0 && !isLoadingModels && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">API Models Loaded</h3>
              <p className="text-sm text-green-600">Using {Array.isArray(apiModels) ? apiModels.length : 0} models from BioDigital API</p>
            </div>
          </div>
        </div>
      )}

      {apiModels.length === 0 && !isLoadingModels && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-800">Using Fallback Models</h3>
              <p className="text-sm text-blue-600">No BioDigital API key configured, using built-in model database</p>
            </div>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-800">Analyzing with Claude AI...</h3>
              <p className="text-sm text-blue-600">Determining best model and movements for this patient</p>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection Info */}
      {selectedModel && !isAnalyzing && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-800">
                Selected Model: {BIODIGITAL_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
              </h3>
              <p className="text-sm text-green-600 mt-1">{modelSelectionReason}</p>
              {selectedModel === "production/maleAdult/lower_limb_codepen" && (
                <p className="text-sm text-blue-600 font-semibold mt-2 bg-blue-50 px-2 py-1 rounded">
                  🔥 Testing Library Model: Using your BioDigital library model "6PxP"
                </p>
              )}
              {claudeAnalysis?.confidence_score && (
                <p className="text-xs text-green-500 mt-1">
                  Confidence: {Math.round(claudeAnalysis.confidence_score * 100)}%
                </p>
              )}
            </div>
            <div className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded">
              {selectedModel}
            </div>
          </div>
        </div>
      )}

      {/* Claude Analysis Results */}
      {claudeAnalysis && !isAnalyzing && (
        <div className="mb-4 space-y-3">
          {/* Text-to-Model Mapping Results */}
          {claudeAnalysis.mapping_results && claudeAnalysis.mapping_results.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🔗 Text-to-Model Mapping</h4>
              <div className="space-y-2">
                {claudeAnalysis.mapping_results.map((result: any, index: number) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-700">"{result.pain_area}"</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                          {Math.round(result.confidence * 100)}% confidence
                        </span>
                        <span className="text-xs text-blue-400 bg-blue-200 px-2 py-1 rounded">
                          Score: {result.score}
                        </span>
                      </div>
                    </div>
                    <div className="text-blue-600 text-xs mt-1">
                      → {result.model} • {result.objectIds.length} anatomy objects
                    </div>
                    <div className="text-blue-500 text-xs mt-1">{result.reasoning}</div>
                    {result.mapping_key && result.mapping_key !== 'default' && (
                      <div className="text-blue-400 text-xs mt-1">
                        Mapping key: {result.mapping_key}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Information */}
          {claudeAnalysis.debug_info && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">🐛 Debug Information</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Selected Model: <span className="font-mono">{claudeAnalysis.recommended_model}</span></div>
                <div>Total Score: <span className="font-mono">{claudeAnalysis.debug_info.total_score}</span></div>
                <div>Model Groups: <span className="font-mono">{Object.keys(claudeAnalysis.debug_info.model_groups).join(', ')}</span></div>
                <div>Selected Group Size: <span className="font-mono">{claudeAnalysis.debug_info.selected_group.length}</span></div>
              </div>
            </div>
          )}

          {/* Recommended Movements */}
          {claudeAnalysis.recommended_movements && claudeAnalysis.recommended_movements.length > 0 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">🏃 Recommended Movements</h4>
              <div className="space-y-2">
                {claudeAnalysis.recommended_movements.map((movement: any, index: number) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-purple-700">{movement.name}</div>
                    <div className="text-purple-600">{movement.description}</div>
                    <div className="text-xs text-purple-500 mt-1">
                      Difficulty: {movement.difficulty} • Purpose: {movement.purpose}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anatomy Objects */}
          {claudeAnalysis.anatomy_objects && claudeAnalysis.anatomy_objects.length > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">🦴 BioDigital Anatomy Objects</h4>
              <div className="space-y-1">
                {claudeAnalysis.anatomy_objects.map((obj: any, index: number) => (
                  <div key={index} className="text-sm text-orange-700">
                    <span className="font-medium">{obj.name}</span> ({obj.id})
                  </div>
                ))}
              </div>
              <div className="text-xs text-orange-500 mt-2">
                These objects will be highlighted in the 3D model
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={highlightProblematicAreas}
            disabled={!viewerReady}
          >
            <Eye className="w-4 h-4 mr-2" />
            Highlight Areas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            disabled={!viewerReady}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={!viewerReady}
          >
            <ZoomIn className="w-4 h-4 mr-2" />
            Zoom In
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={!viewerReady}
          >
            <ZoomOut className="w-4 h-4 mr-2" />
            Zoom Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={debugAnatomyObjects}
            disabled={!viewerReady}
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            🔍 Debug Objects
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          {isLoading ? 'Loading 3D viewer...' : viewerReady ? 'Ready' : 'Initializing...'}
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-600">Loading 3D anatomy viewer...</p>
            </div>
          </div>
        )}
        
        <iframe
          id="embedded-human"
          ref={iframeRef}
          src={(() => {
            const isLibraryModel = selectedModel === "production/maleAdult/lower_limb_codepen";
            // Use your exact iframe URL with model 6PxP
            const libraryUrl = `https://human.biodigital.com/viewer/?id=6PxP&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=true&ui-chapter-list=false&ui-fullscreen=true&ui-help=true&ui-info=true&ui-label-list=true&ui-layers=true&ui-skin-layers=true&ui-loader=circle&ui-media-controls=full&ui-menu=true&ui-nav=true&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=true&initial.none=true&disable-scroll=false&dk=${biodigitalKey}&paid=o_0866e6f1`;
            const defaultUrl = `https://human.biodigital.com/viewer/?id=${selectedModel}&ui-info=false&ui-menu=false&dk=${biodigitalKey}`;
            
            const finalUrl = isLibraryModel ? libraryUrl : defaultUrl;
            console.log('🎬 Loading iframe with URL:', finalUrl);
            console.log('🧪 Is Library Model (6PxP):', isLibraryModel);
            
            return finalUrl;
          })()}
          frameBorder="0"
          style={{ aspectRatio: '4 / 3', width: '100%' }}
          allowFullScreen={true}
          loading="lazy"
          className="border-0"
          title="3D Human Anatomy Viewer"
        />
      </div>

      {/* Debug Panel */}
      {debugMode && availableObjects.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-900">Available Anatomy Objects (Debug)</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDebugMode(false)}
              className="text-blue-700 border-blue-300"
            >
              Hide Debug
            </Button>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {availableObjects.slice(0, 50).map((obj, index) => (
                <div
                  key={index}
                  className="p-2 bg-white rounded border text-gray-700 cursor-pointer hover:bg-blue-100"
                  onClick={() => {
                    console.log('Selected object:', obj)
                    // Try to highlight this object
                    if (window.HumanAPI) {
                      window.HumanAPI.send('scene.color', {
                        objects: [obj.id || obj.name],
                        color: { r: 0, g: 1, b: 0 },
                        opacity: 0.8
                      })
                    }
                  }}
                >
                  <div className="font-medium">{obj.name || obj.id}</div>
                  <div className="text-gray-500">ID: {obj.id}</div>
                </div>
              ))}
            </div>
            {availableObjects.length > 50 && (
              <p className="text-xs text-blue-600 mt-2">
                Showing first 50 objects. Check console for full list.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Problematic Areas Legend */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Problematic Areas</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {problematicAreas.map((area, index) => (
            <div
              key={index}
              className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => focusOnArea(area.id)}
            >
              <div
                className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                style={{
                  backgroundColor: `rgb(${area.color.r * 255}, ${area.color.g * 255}, ${area.color.b * 255})`,
                  opacity: area.opacity
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{area.name}</p>
                <p className="text-xs text-gray-600 truncate">{area.description}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                area.severity === 'high' ? 'bg-red-100 text-red-800' :
                area.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {area.severity}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Extend Window interface for HumanAPI
declare global {
  interface Window {
    HumanAPI: any
    jQuery: any
  }
}
