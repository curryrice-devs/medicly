import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ExerciseBioDigitalPreviewProps {
  exercise: {
    name: string
    description?: string
    category?: string
    muscleGroups?: string[]
  }
  className?: string
  cachedModelUrl?: string // Optional cached URL to use instead of calling Claude
  sessionId?: string // Session ID to save URLs to database
}

export function ExerciseBioDigitalPreview({ exercise, className = '', cachedModelUrl, sessionId }: ExerciseBioDigitalPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>('')

  // Get BioDigital key from environment
  const biodigitalKey = process.env.NEXT_PUBLIC_BIODIGITAL_KEY || 'YOUR_APP_KEY'

  // Get BioDigital model for this exercise
  const loadModel = async () => {
    try {
      // If we have a cached URL, use it directly
      if (cachedModelUrl) {
        console.log('📦 Using cached BioDigital model URL:', cachedModelUrl);
        setSelectedModelUrl(cachedModelUrl);
        // Extract model ID from URL for display
        const modelIdMatch = cachedModelUrl.match(/be=([^&]+)/);
        if (modelIdMatch) {
          setSelectedModel(modelIdMatch[1]);
        }
        setIsLoading(false);
        return;
      }

      // Otherwise, call Claude to get the model
      const exerciseDescription = `${exercise.name}: ${exercise.description || ''}`;
      
      console.log('🚀 Getting BioDigital model for exercise via Claude:', exerciseDescription);
      
      const response = await fetch('/api/biodigital/select-model-for-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseDescription: exerciseDescription,
          bodyPart: exercise.muscleGroups?.[0] || 'General',
          aiAnalysis: {
            exercise: exercise.name,
            category: exercise.category,
            muscleGroups: exercise.muscleGroups
          },
          sessionId,
          isExercisePreview: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Got BioDigital model for exercise:', result.selectedModelId);
        setSelectedModel(result.selectedModelId);
        setSelectedModelUrl(result.selectedModel?.viewerUrl || '');
        setIsLoading(false);
      } else {
        console.error('❌ Failed to get BioDigital model for exercise');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error getting BioDigital model for exercise:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModel()
  }, [exercise.name, exercise.description])

  return (
    <div className={`relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-4 h-4 text-blue-600 mx-auto mb-1 animate-spin" />
            <p className="text-xs text-gray-600">Loading 3D preview...</p>
          </div>
        </div>
      ) : selectedModel ? (
        <iframe
          src={selectedModelUrl || `https://human.biodigital.com/viewer/?be=${selectedModel}&dk=${biodigitalKey}&ui-info=false&ui-menu=false&ui-toolbar=false`}
          frameBorder="0"
          style={{ width: '100%', height: '100%' }}
          allowFullScreen={true}
          loading="lazy"
          className="border-0"
          title={`3D Preview: ${exercise.name}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <p className="text-xs">No 3D preview available</p>
          </div>
        </div>
      )}
    </div>
  )
}
