'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, XCircle, Edit3, Clock, AlertCircle, User, Calendar, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatientCase } from '@/types/medical.types'
import { doctorApi } from '@/services/api'
import { PatientContextPanel } from '../../components/ExerciseReview/PatientContextPanel'
import { RecommendationCard } from '../../components/ExerciseReview/RecommendationCard'
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer'
import { ActionButtons } from '../../components/CaseReview/ActionButtons'
import { ExerciseSaveModal } from '../../components/CaseReview/ExerciseSaveModal'
import { RejectionModal } from '../../components/CaseReview/RejectionModal'
import { BioDigitalViewer } from '@/components/BioDigitalViewer'
import { parseAIAnalysis, createFallbackAnalysis } from '@/types/ai-analysis.types'

export default function CaseReviewRoute() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [caseData, setCaseData] = React.useState<PatientCase | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Exercise save state
  const [isExerciseSaved, setIsExerciseSaved] = React.useState(true) // Start as saved (no changes yet)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [exerciseModifications, setExerciseModifications] = React.useState<any>({})

  // Modal states
  const [showExerciseSaveModal, setShowExerciseSaveModal] = React.useState(false)
  const [showRejectionModal, setShowRejectionModal] = React.useState(false)

  // Action states
  const [isApproving, setIsApproving] = React.useState(false)
  const [isRejecting, setIsRejecting] = React.useState(false)
  const [isSavingExercise, setIsSavingExercise] = React.useState(false)

  // Helper function to get full AI analysis data
  const getAIAnalysisData = React.useMemo(() => {
    if (!caseData) return null;
    
    // Try to get the original ai_evaluation data from the session
    // For now, we'll reconstruct it from the PatientCase data
    const reconstructedAnalysis = {
      confidence: caseData.aiConfidence || 0.8,
      primaryDiagnosis: caseData.injuryType || 'Assessment pending',
      injuryType: caseData.injuryType || 'General',
      bodyPart: caseData.recommendedExercise?.bodyPart || '',
      summary: caseData.aiAnalysis || 'Analysis pending',
      reasoning: typeof caseData.reasoning === 'string' ? caseData.reasoning : 'Analysis in progress',
      movementMetrics: caseData.movementMetrics || [],
      rangeOfMotion: caseData.rangeOfMotion ? Object.entries(caseData.rangeOfMotion).map(([key, degrees]) => ({
        joint: key.replace(/[A-Z]/g, ' $&').trim().split(' ')[0] || 'Joint',
        movement: key.replace(/[A-Z]/g, ' $&').trim().split(' ').slice(1).join(' ') || 'movement',
        degrees: degrees,
        normalRange: '0-180°',
        status: degrees < 90 ? 'limited' : degrees > 180 ? 'hypermobile' : 'normal'
      })) : [],
      compensatoryPatterns: [],
      painIndicators: caseData.painIndicators ? caseData.painIndicators.map(indicator => {
        const parts = indicator.split(': ');
        const location = parts[0] || 'Unknown';
        const rest = parts[1] || '';
        const severityMatch = rest.match(/\((\d+)\/10\)/);
        const severity = severityMatch ? parseInt(severityMatch[1]) : 5;
        const type = rest.replace(/\(\d+\/10\)/, '').replace('pain', '').trim() || 'aching';
        
        return {
          location,
          severity,
          type: type as any,
          triggers: []
        };
      }) : [],
      functionalLimitations: [],
      urgencyLevel: caseData.urgency,
      urgencyReason: `${caseData.urgency} priority case`,
      redFlags: [],
      recommendedExercise: {
        name: caseData.recommendedExercise?.name,
        rationale: 'Recommended based on assessment',
        contraindications: caseData.recommendedExercise?.contraindications || [],
        progressionNotes: caseData.recommendedExercise?.progressionLevels?.[0] || ''
      },
      followUpRecommendations: {
        timeframe: '1-2 weeks',
        monitorFor: ['Pain levels', 'Functional improvement'],
        progressIndicators: ['Improved movement', 'Reduced pain'],
        escalationCriteria: ['Worsening symptoms', 'No improvement']
      }
    };
    
    return reconstructedAnalysis;
  }, [caseData]);

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const data = await doctorApi.getCaseById(id)
        if (mounted) setCaseData(data)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load case')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (id) load()
    return () => { mounted = false }
  }, [id])
  const [isEditingRecommendation, setIsEditingRecommendation] = React.useState(false)
  const exerciseSectionRef = React.useRef<HTMLDivElement>(null)

  // Action handlers
  const handleApprove = async () => {
    if (!isExerciseSaved) {
      setShowExerciseSaveModal(true)
      return
    }

    setIsApproving(true)
    try {
      const success = await doctorApi.updateCaseStatus(id, 'active')
      if (success) {
        // Update local state
        setCaseData(prev => prev ? { ...prev, status: 'active' as const } : null)
        // Could show success toast here
        console.log('Case approved successfully')
      }
    } catch (e) {
      console.error('Failed to approve case:', e)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = () => {
    setShowRejectionModal(true)
  }

  const handleConfirmRejection = async (reason: string, notes?: string) => {
    setIsRejecting(true)
    try {
      const success = await doctorApi.updateCaseStatus(id, 'rejected', notes || reason)
      if (success) {
        setCaseData(prev => prev ? { ...prev, status: 'rejected' as const } : null)
        setShowRejectionModal(false)
        console.log('Case rejected successfully')
      }
    } catch (e) {
      console.error('Failed to reject case:', e)
    } finally {
      setIsRejecting(false)
    }
  }

  const handleExerciseChange = (changes: any) => {
    setExerciseModifications((prev: any) => ({ ...prev, ...changes }))
    setHasUnsavedChanges(true)
    setIsExerciseSaved(false)
  }

  const handleSaveExercise = async () => {
    setIsSavingExercise(true)
    try {
      const success = await doctorApi.updateExercise(id, exerciseModifications)
      if (success) {
        setIsExerciseSaved(true)
        setHasUnsavedChanges(false)
        setShowExerciseSaveModal(false)
        console.log('Exercise saved successfully')
      }
    } catch (e) {
      console.error('Failed to save exercise:', e)
    } finally {
      setIsSavingExercise(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Case</h1>
            <p className="text-gray-600 mb-6">Please wait while we load the case details.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Case Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested case could not be found.'}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'feedback': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header - More Compact */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Case Review: {caseData.id}
            </h1>
            <div className="flex items-center space-x-4">
              <p className="text-gray-600">
                {caseData.patientName ? `${caseData.patientName} • #${caseData.patientId.slice(0, 8)}` : `Patient #${caseData.patientId.slice(0, 8)}`} • {caseData.injuryType} • Submitted {new Date(caseData.submittedAt).toLocaleDateString()}
              </p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(caseData.status)}`}>
                {caseData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <ActionButtons
          caseStatus={caseData.status}
          isExerciseSaved={isExerciseSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          isApproving={isApproving}
          isRejecting={isRejecting}
          isSavingExercise={isSavingExercise}
          onApprove={handleApprove}
          onReject={handleReject}
          onSaveExercise={handleSaveExercise}
        />



                {/* Top Row - Video and AI Analysis Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Left Column - Patient Video */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Patient Video
                {caseData.processedVideoUrl && (
                  <span className="text-sm text-green-600 ml-2">
                    (AI Enhanced)
                  </span>
                )}
              </h3>
              <div className="relative">
                {/* Large video container with better aspect ratio */}
                <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden shadow-inner">
                  {(caseData.processedVideoUrl || caseData.originalVideoUrl || caseData.videoUrl) ? (
                    <video
                      src={caseData.processedVideoUrl || caseData.originalVideoUrl || caseData.videoUrl}
                      controls
                      className="w-full h-full object-contain"
                      preload="metadata"
                      style={{ backgroundColor: '#000' }}
                      onLoadStart={() => console.log('🎥 Doctor video loading:', { processedUrl: caseData.processedVideoUrl, originalUrl: caseData.originalVideoUrl, fallbackUrl: caseData.videoUrl })}
                      onError={(e) => console.error('❌ Doctor video failed:', e.currentTarget.src)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Video className="w-16 h-16 mx-auto mb-3" />
                        <p className="text-lg font-medium">No video available</p>
                        <p className="text-sm text-gray-500">Video will appear here when uploaded</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Movement Metrics - Below Video */}
            {caseData.movementMetrics && caseData.movementMetrics.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Movement Metrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {caseData.movementMetrics.map((metric, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-600">
                        {metric.label}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {metric.value}°
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - AI Analysis */}
          <div className="space-y-4">
            {/* AI Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Analysis & 3D Visualization
              </h3>
              
              {/* Display AI Analysis properly */}
              {caseData.aiAnalysis ? (
                <div className="space-y-4">
                  {/* Check if it's the new JSONB format */}
                  {typeof caseData.aiAnalysis === 'object' && caseData.aiAnalysis.analysis ? (
                    <>
                      {/* Movement Overview */}
                      {caseData.aiAnalysis.analysis.stage_1_movement_overview && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <h5 className="text-sm font-semibold text-green-900 mb-2">Movement Overview</h5>
                          <p className="text-sm text-green-800 leading-relaxed">
                            {typeof caseData.aiAnalysis.analysis.stage_1_movement_overview === 'string' 
                              ? caseData.aiAnalysis.analysis.stage_1_movement_overview
                              : JSON.stringify(caseData.aiAnalysis.analysis.stage_1_movement_overview)
                            }
                          </p>
                        </div>
                      )}
                      
                      {/* Health Assessment */}
                      {caseData.aiAnalysis.analysis.analysis_summary?.overall_health_assessment && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h5 className="text-sm font-semibold text-blue-900 mb-2">Health Assessment</h5>
                          <p className="text-sm text-blue-800 leading-relaxed">
                            {caseData.aiAnalysis.analysis.analysis_summary.overall_health_assessment}
                          </p>
                        </div>
                      )}
                      
                      {/* Recommendations */}
                      {caseData.aiAnalysis.analysis.analysis_summary?.main_recommendations && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <h5 className="text-sm font-semibold text-amber-900 mb-2">Recommendations</h5>
                          <ul className="text-sm text-amber-800 space-y-1">
                            {caseData.aiAnalysis.analysis.analysis_summary.main_recommendations.map((rec: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Fallback for string format */
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {typeof caseData.aiAnalysis === 'string' ? caseData.aiAnalysis : JSON.stringify(caseData.aiAnalysis)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">No AI analysis available</p>
              )}
              
              {/* AI Confidence */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    AI Confidence: {Math.round((caseData.aiConfidence || 0) * 100)}%
                  </span>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {typeof caseData.reasoning === 'string' ? caseData.reasoning : JSON.stringify(caseData.reasoning)}
                </p>
              </div>

              {/* BioDigital 3D Anatomical Model */}
              {getAIAnalysisData && (
                <div className="mt-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">3D Anatomical Visualization</h4>
                  <BioDigitalViewer 
                    problematicAreas={[
                      {
                        name: caseData.injuryType || 'General',
                        description: `${getAIAnalysisData.summary} - ${getAIAnalysisData.primaryDiagnosis || caseData.injuryType || 'Movement analysis'}`
                      }
                    ]}
                    patientId={caseData.patientId}
                    patientInfo={getAIAnalysisData.summary}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Full Width Components */}
        <div className="space-y-6">
          {/* Patient Context */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Patient Context
            </h3>
            <PatientContextPanel caze={caseData} />
          </div>

          {/* Exercise Recommendation */}
          <div ref={exerciseSectionRef} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Exercise Recommendation
            </h3>
          <RecommendationCard
            exercise={caseData.recommendedExercise}
            confidence={caseData.aiConfidence}
            reasoning={caseData.reasoning}
            initialEditing={isEditingRecommendation}
            onEditingChange={setIsEditingRecommendation}
            onSave={async (params: any, newExercise: any) => {
              console.log('Saving exercise updates:', params, newExercise)
              setIsSavingExercise(true)
              try {
                // Save exercise updates to database
                const updates = {
                  ...params,
                  exerciseId: newExercise?.id,
                  exerciseName: newExercise?.name,
                  exerciseDescription: newExercise?.description
                }
                const success = await doctorApi.updateExercise(id, updates)
                if (success) {
                  setIsExerciseSaved(true)
                  setHasUnsavedChanges(false)
                  console.log('Exercise saved successfully to database')
                  // Update local case data
                  setCaseData(prev => prev ? {
                    ...prev,
                    recommendedExercise: newExercise
                  } : null)
                } else {
                  throw new Error('Failed to save exercise updates')
                }
              } catch (error) {
                console.error('Failed to save exercise:', error)
                // Could show a toast notification here
                alert('Failed to save exercise updates. Please try again.')
              } finally {
                setIsSavingExercise(false)
              }
            }}
            isSaving={isSavingExercise}
            cachedModelUrl={caseData.exercise_models?.split(',')[0]} // Use first exercise model URL if available
            sessionId={caseData.id} // Use case ID as session ID
          />
          </div>
        </div>

        {/* Modals */}
        <ExerciseSaveModal
          isOpen={showExerciseSaveModal}
          onClose={() => setShowExerciseSaveModal(false)}
          onSaveAndApprove={async () => {
            await handleSaveExercise()
            // After saving, proceed with approval
            if (isExerciseSaved) {
              await handleApprove()
            }
          }}
          isSaving={isSavingExercise}
        />

        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          onConfirmRejection={handleConfirmRejection}
          isRejecting={isRejecting}
        />
      </div>
    </div>
  )
}