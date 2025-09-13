import React, { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface BioDigitalViewerProps {
  problematicAreas: Array<{
    name: string
    description?: string
    severity?: string
    color?: { r: number; g: number; b: number }
    opacity?: number
  }>
  patientId: string
  patientInfo?: any
}

export function BioDigitalViewer({ problematicAreas, patientId, patientInfo }: BioDigitalViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>('')

  // Get BioDigital key from environment
  const biodigitalKey = process.env.NEXT_PUBLIC_BIODIGITAL_KEY || 'YOUR_APP_KEY'

  // Simple function: get case summary → call Claude → render model
  const loadModel = async () => {
    if (!problematicAreas || problematicAreas.length === 0) {
      setIsLoading(false);
      return;
    }
    
    try {
      const caseDescription = problematicAreas.map(area => 
        `${area.name}: ${area.description || ''}`
      ).join('; ');
      
      console.log('🚀 Getting model for case:', caseDescription);
      
      const response = await fetch('/api/biodigital/select-model-for-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseDescription,
          bodyPart: problematicAreas[0]?.name,
          aiAnalysis: patientInfo
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Got model:', result.selectedModelId);
        setSelectedModel(result.selectedModelId);
        setSelectedModelUrl(result.selectedModel?.viewerUrl || '');
        setIsLoading(false);
      } else {
        console.error('❌ Failed to get model');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error getting model:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModel()
  }, [problematicAreas, patientInfo])

  return (
    <div className="w-full">
      {/* 3D Viewer */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        {/* Simple Loading/Model Display */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-600">Loading 3D model...</p>
            </div>
          </div>
        ) : selectedModel ? (
          <iframe
            id="embedded-human"
            ref={iframeRef}
            src={selectedModelUrl || `https://human.biodigital.com/viewer/?be=${selectedModel}&dk=${biodigitalKey}&ui-info=false&ui-menu=false`}
            frameBorder="0"
            style={{ aspectRatio: '4 / 3', width: '100%' }}
            allowFullScreen={true}
            loading="lazy"
            className="border-0"
            title="3D Human Anatomy Viewer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-sm">No model available</p>
            </div>
          </div>
        )}
      </div>

      {/* Model Info */}
      {selectedModel && (
        <div className="mt-2 text-xs text-gray-500">
          <div>Model: <span className="font-mono">{selectedModel}</span></div>
        </div>
      )}
    </div>
  )
}