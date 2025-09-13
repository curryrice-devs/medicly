'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, XCircle, Edit3, Clock, AlertCircle, User, Calendar, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatientCase } from '@/types/medical.types'
import { doctorApi } from '@/services/api'
import { PatientContextPanel } from '../../components/ExerciseReview/PatientContextPanel'
import { RecommendationCard } from '../../components/ExerciseReview/RecommendationCard'
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer'

export default function CaseReviewRoute() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [caseData, setCaseData] = React.useState<PatientCase | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

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
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'modified': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
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
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Case Review: {caseData.id}
              </h1>
              <p className="text-gray-600">
                Patient {caseData.patientId} • {caseData.injuryType}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(caseData.status)}`}>
                {caseData.status}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(caseData.urgency)}`}>
                {caseData.urgency} priority
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Patient ID: {caseData.patientId}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Submitted: {new Date(caseData.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2"
                onClick={() => {
                  setIsEditingRecommendation(true)
                  // Scroll to exercise section and trigger change exercise
                  setTimeout(() => {
                    exerciseSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
                    // Trigger the change exercise button click after a short delay
                    setTimeout(() => {
                      const changeExerciseBtn = document.querySelector('[data-change-exercise]') as HTMLButtonElement
                      changeExerciseBtn?.click()
                    }, 500)
                  }, 100)
                }}
              >
                <Edit3 className="w-4 h-4" />
                <span>Modify</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50">
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </Button>
              <Button size="sm" className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Patient Video */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 text-indigo-600 mr-2" />
            Patient Video
          </h3>
          <VideoPlayer src={caseData.videoUrl} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Left Column - Patient Context */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 text-green-600 mr-2" />
                Patient Context
              </h3>
              <PatientContextPanel caze={caseData} />
            </div>
          </div>

          {/* Right Column - AI Analysis & Movement Metrics */}
          <div className="space-y-6">
            {/* AI Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                AI Analysis
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {caseData.aiAnalysis}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    AI Confidence: {Math.round((caseData.aiConfidence || 0) * 100)}%
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  {caseData.reasoning}
                </p>
              </div>
            </div>

            {/* Movement Metrics */}
            {caseData.movementMetrics && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-purple-600 mr-2" />
                  Movement Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {caseData.movementMetrics.map((metric, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {metric.label}
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exercise Recommendation */}
        <div ref={exerciseSectionRef} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
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
              // Handle accept logic
            }}
            onModify={async (params: any, newExercise: any) => {
              console.log('Exercise modified:', params, newExercise)
              setIsEditingRecommendation(false)
              // Handle modify logic
            }}
          />
        </div>

        {/* Case Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 text-gray-600 mr-2" />
            Case Timeline
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Case Submitted</p>
                <p className="text-sm text-gray-600">
                  {new Date(caseData.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-500">Awaiting Review</p>
                <p className="text-sm text-gray-500">Pending doctor approval</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}