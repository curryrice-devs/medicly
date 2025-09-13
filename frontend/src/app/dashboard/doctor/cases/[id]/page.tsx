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
  const [exerciseModifications, setExerciseModifications] = React.useState<{ sets?: number; reps?: number; frequency?: string; notes?: string }>({})

  // Modal states
  const [showExerciseSaveModal, setShowExerciseSaveModal] = React.useState(false)
  const [showRejectionModal, setShowRejectionModal] = React.useState(false)

  // Action states
  const [isApproving, setIsApproving] = React.useState(false)
  const [isRejecting, setIsRejecting] = React.useState(false)
  const [isSavingExercise, setIsSavingExercise] = React.useState(false)

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

  const handleExerciseChange = (changes: { sets?: number; reps?: number; frequency?: string; notes?: string }) => {
    setExerciseModifications((prev: { sets?: number; reps?: number; frequency?: string; notes?: string }) => ({ ...prev, ...changes }))
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
                Patient {caseData.patientId} • {caseData.injuryType} • Submitted {new Date(caseData.submittedAt).toLocaleDateString()}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          
          {/* Left Column - Patient Video (Larger) */}
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

          {/* Right Column - AI Analysis & Movement Metrics */}
          <div className="space-y-4">
            {/* AI Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Analysis
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
                    <p className="text-gray-700 leading-relaxed">
                      {typeof caseData.aiAnalysis === 'string' ? caseData.aiAnalysis : JSON.stringify(caseData.aiAnalysis)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">No AI analysis available</p>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    AI Confidence: {Math.round((caseData.aiConfidence || 0) * 100)}%
                  </span>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {typeof caseData.reasoning === 'string' ? caseData.reasoning : JSON.stringify(caseData.reasoning)}
                </p>
              </div>
            </div>

            {/* Movement Metrics */}
            {caseData.movementMetrics && caseData.movementMetrics.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Movement Metrics
                </h3>
                <div className="space-y-3">
                  {caseData.movementMetrics.map((metric, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-600">
                        {metric.label}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Patient Context - Full Width Below */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Patient Context
          </h3>
          <PatientContextPanel caze={caseData} />
        </div>

        {/* Exercise Recommendation */}
        <div ref={exerciseSectionRef} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Exercise Recommendation
          </h3>
          <RecommendationCard
            exercise={caseData.recommendedExercise}
            confidence={caseData.aiConfidence}
            reasoning={caseData.reasoning}
            initialEditing={isEditingRecommendation}
            onEditingChange={setIsEditingRecommendation}
            onAccept={async () => {
              console.log('Exercise accepted')
              setIsExerciseSaved(true)
              setHasUnsavedChanges(false)
            }}
            onModify={async (params: { sets?: number; reps?: number; frequency?: string; notes?: string }, newExercise: Exercise) => {
              console.log('Exercise modified:', params, newExercise)
              handleExerciseChange({ ...params, exerciseId: newExercise?.id })
              setIsEditingRecommendation(false)
            }}
          />
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