'use client'

import React, { useState, useRef, useCallback } from 'react'
import { 
  Upload, 
  Video, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Play,
  ArrowLeft,
  Activity
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import { useVideoUpload } from '@/hooks/useVideoUpload'
import { useSessionVideo } from '@/hooks/useSessionVideo'
import { useToast } from '@/hooks/use-toast'

type ProcessingStep = 'idle' | 'uploading' | 'processing_pose' | 'extracting_keyframes' | 'claude_analysis' | 'complete'
type VideoMode = 'original' | 'processed'

interface AnalysisResult {
  analysis_type?: string
  timestamp?: string
  stage_1_movement_overview?: string
  stage_2_health_report?: any
  analysis_summary?: {
    movement_identified?: string
    confidence_level?: number
    technique_quality?: string
    overall_health_assessment?: string
    key_concerns?: string[]
    main_recommendations?: string[]
    analysis_quality?: string
  }
  movement_identified?: string
  confidence?: number
  message?: string
  key_frames?: any[]
  error?: string
}

export default function ExerciseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.sessionId as string
  const exerciseName = params?.exerciseName as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoId, setVideoId] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('idle')
  const [stepProgress, setStepProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [videoMode, setVideoMode] = useState<VideoMode>('original')
  const [keyFrames, setKeyFrames] = useState<any[]>([])
  const [patientNotes, setPatientNotes] = useState<string>('')
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()
  
  // Use session video hook following auctor_demo pattern
  const { 
    originalVideoUrl, 
    processedVideoUrl, 
    patientNotes: existingPatientNotes,
    aiEvaluation: existingAiEvaluation,
    doctorFeedback,
    sessionStatus,
    isVideoReady, 
    isLoading: isLoadingVideos,
    error: videoError,
    refetch: refetchVideos
  } = useSessionVideo(sessionId)
  
  // Use Supabase video upload hook
  const { 
    isUploading,
    uploadProgress,
    uploadError,
    uploadedVideo,
    uploadVideo,
    reset: resetUpload
  } = useVideoUpload({
    userId: user?.id || '',
    sessionId,
    onUploadComplete: (result) => {
      console.log('✅ Video uploaded to Supabase:', result)
      setVideoId(result.id)
      // Refetch session videos to get updated URLs
      setTimeout(() => refetchVideos(), 1000)
    },
    onUploadError: (error) => {
      console.error('❌ Supabase upload failed:', error)
      setError(error)
    }
  })

  // Load existing session data when available
  React.useEffect(() => {
    if (existingPatientNotes && !patientNotes) {
      setPatientNotes(existingPatientNotes)
      console.log('📝 Loaded existing patient notes')
    }
    if (existingAiEvaluation && !analysisResult) {
      setAnalysisResult(existingAiEvaluation)
      console.log('🤖 Loaded existing AI evaluation')
    }
    
    // Session Status Flow:
    // 'pending' -> waiting for doctor review
    // 'active' -> approved by doctor, in progress  
    // 'completed' -> analysis done, show video + progress + patient notes
    // 'feedback' -> doctor provided feedback, show everything + doctor feedback
    // 'rejected' -> rejected by doctor
    if ((sessionStatus === 'completed' || sessionStatus === 'feedback') && currentStep === 'idle') {
      setCurrentStep('complete')
      console.log(`✅ Session status: ${sessionStatus} - showing analysis results`)
    }
  }, [existingPatientNotes, existingAiEvaluation, sessionStatus])

  // Fetch session data to get video URLs
  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // setSessionData(result.data) // This state is no longer needed
          console.log('📋 Session data loaded:', result.data)
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch session data:', error)
    }
  }

  // Load session data on mount
  React.useEffect(() => {
    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  // Auto-switch to processed video when analysis completes
  React.useEffect(() => {
    if (currentStep === 'complete' && analysisResult && videoMode !== 'processed') {
      console.log('🎯 Analysis complete, switching to processed video view')
      setVideoMode('processed')
      // Refetch to get latest postvidurl
      refetchVideos()
    }
  }, [currentStep, analysisResult]) // Remove refetchVideos from dependencies

  const stepLabels = {
    idle: 'Ready to analyze',
    uploading: 'Uploading your video',
    processing_pose: 'Detecting pose landmarks with MediaPipe',
    extracting_keyframes: 'Extracting key frames for analysis',
    claude_analysis: 'AI analyzing movement patterns and health insights',
    complete: 'Analysis complete'
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      setVideoId('')
      setAnalysisResult(null)
      setError(null)
      setCurrentStep('idle')
      setStepProgress(0)
    }
  }

  const simulateStep = (step: ProcessingStep, duration: number) => {
    return new Promise<void>((resolve) => {
      const interval = 50
      const increment = 100 / (duration / interval)
      let progress = 0
      let currentProgress = 0
      
      const timer = setInterval(() => {
        progress += increment
        const newProgress = Math.min(progress, 100)
        
        // Only update if progress actually changed
        if (Math.floor(newProgress) !== Math.floor(currentProgress)) {
          currentProgress = newProgress
          setStepProgress(currentProgress)
        }
        
        if (progress >= 100) {
          clearInterval(timer)
          setStepProgress(100)
          resolve()
        }
      }, interval)
    })
  }

  const startAnalysis = async () => {
    console.log('🚀 startAnalysis called!')
    console.log('📁 selectedFile:', selectedFile)
    
    if (!selectedFile) {
      console.log('❌ No file selected!')
      return
    }

    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    setError(null)
    setAnalysisResult(null)
    setKeyFrames([])

    try {
      console.log('🎬 Starting analysis...')
      console.log('📁 Selected file:', selectedFile.name, selectedFile.size, selectedFile.type)
      
      // Step 0: Check backend health
      try {
        console.log('🏥 Checking backend health...')
        const healthResponse = await fetch('http://localhost:8001/api/health')
        if (!healthResponse.ok) {
          throw new Error('Backend is not responding')
        }
        const health = await healthResponse.json()
        console.log('✅ Backend health check:', health)
      } catch (healthError) {
        throw new Error('Backend is not running. Please start the backend server.')
      }
      
      // Step 1: Upload video to Supabase
      setCurrentStep('uploading')
      setStepProgress(0)
      
      let currentVideoId: string
      let uploadResult: any
      
             try {
        console.log('⬆️ Starting video upload to Supabase...')
        uploadResult = await uploadVideo(selectedFile)
        currentVideoId = uploadResult.id
        setVideoId(currentVideoId)
        console.log('✅ Upload completed with video ID:', currentVideoId)
        
      } catch (uploadError) {
        console.error('❌ Video upload failed:', uploadError)
        throw new Error(`Upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
      }
      
      if (!currentVideoId) {
        throw new Error('Upload completed but no video ID received')
      }

      // Wait for uploadedVideo state to be available
      let attempts = 0
      while (!uploadedVideo && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
        console.log(`⏳ Waiting for uploadedVideo state (${attempts}/10)`)
      }
      
      // Save original video URL to session (previdurl)
      try {
        console.log('💾 Saving original video URL to session...')
        const videoUrl = uploadResult.url || uploadResult.signedUrl || uploadedVideo?.url
        
        const updateResponse = await fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previdurl: videoUrl,
            status: 'active' // Use correct enum value
          })
        })
         
        if (updateResponse.ok) {
          const updatedSession = await updateResponse.json()
          console.log('✅ Original video URL linked to session:', updatedSession.data)
          // Refetch session videos to update display
          refetchVideos()
        } else {
          const errorData = await updateResponse.json()
          console.warn('⚠️ Failed to link original video URL to session:', errorData.error)
         }
      } catch (dbError) {
        console.warn('⚠️ Database error linking original video to session:', dbError)
        // Continue anyway - this is just for persistence
      }

      // Step 2: Process poses using backend (download from Supabase, process, upload back)
      setCurrentStep('processing_pose')
      setStepProgress(0)
      
      console.log('🔄 Starting pose processing for video:', currentVideoId)
      
      // Debug: Check what data we have available
      console.log('🔍 Debug data for processing:', {
        currentVideoId,
        uploadResult,
        uploadedVideo,
        sessionId
      })
      
      const processingPayload = {
        video_id: currentVideoId,
        video_url: uploadResult?.url || uploadResult?.signedUrl || uploadedVideo?.url,
        storage_path: uploadResult?.storagePath || uploadedVideo?.storagePath,
        session_id: sessionId
      }
      
      console.log('📋 Processing payload:', processingPayload)
      
      // Use the Supabase processing endpoint that will upload processed video back to bucket
      const processResponse = await fetch(`http://localhost:8001/api/process-supabase-video`, {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processingPayload)
        })

      if (!processResponse.ok) {
        const errorText = await processResponse.text()
        console.error('❌ Process response error:', errorText)
        throw new Error(`Pose processing failed: ${processResponse.status} - ${errorText}`)
        }

      const processResult = await processResponse.json()
      console.log('✅ Pose processing started:', processResult)

      // Wait for processing to complete by polling status
      console.log('⏳ Waiting for pose processing to complete...')
      let processingComplete = false
      let pollAttempts = 0
      let processedVideoUrl = null
      const maxPollAttempts = 30 // 30 seconds max

      while (!processingComplete && pollAttempts < maxPollAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        pollAttempts++
        
        try {
          const statusResponse = await fetch(`http://localhost:8001/api/status/${currentVideoId}`)
          if (statusResponse.ok) {
            const status = await statusResponse.json()
            console.log(`📊 Processing status (${pollAttempts}/30):`, status.status, status.message)
            
            if (status.status === 'completed') {
              processingComplete = true
              processedVideoUrl = status.processed_video_url // URL from Supabase bucket
              console.log('✅ Pose processing completed!')
              console.log('🎬 Processed video URL:', processedVideoUrl)
            } else if (status.status === 'error' || status.status === 'failed') {
              throw new Error(`Processing failed: ${status.message}`)
            }
            
            // Update progress based on status
            setStepProgress(Math.min((pollAttempts / maxPollAttempts) * 100, 90))
          }
        } catch (statusError) {
          console.warn('⚠️ Status check failed:', statusError)
        }
      }

      if (!processingComplete) {
        throw new Error('Pose processing timed out after 30 seconds')
      }

      // Save processed video URL to session (postvidurl)
      if (processedVideoUrl) {
        try {
          console.log('💾 Saving processed video URL to session...')
          const updateResponse = await fetch(`/api/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postvidurl: processedVideoUrl
            })
          })
          
          if (updateResponse.ok) {
            const updatedSession = await updateResponse.json()
            console.log('✅ Processed video URL linked to session:', updatedSession.data)
          } else {
            const errorData = await updateResponse.json()
            console.warn('⚠️ Failed to link processed video URL to session:', errorData.error)
          }
        } catch (dbError) {
          console.warn('⚠️ Database error linking processed video to session:', dbError)
        }
      }

      setStepProgress(100)

      // Step 3: Extract key frames
      setCurrentStep('extracting_keyframes')
      setStepProgress(0)
      
      await simulateStep('extracting_keyframes', 2000)

      // Step 4: Claude analysis
      setCurrentStep('claude_analysis')
      setStepProgress(0)

      console.log('🧠 Starting AI analysis for video:', currentVideoId)
      const analysisResponse = await fetch(`http://localhost:8001/api/two-stage-analysis/${currentVideoId}`, {
        method: 'POST',
      })

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text()
        console.error('❌ Analysis response error:', errorText)
        throw new Error(`AI analysis failed: ${analysisResponse.status} - ${errorText}`)
      }

      const result = await analysisResponse.json()
      console.log('🎉 Claude analysis result:', result)
      setAnalysisResult(result?.analysis || result)
      
      if (result.key_frames) {
        setKeyFrames(result.key_frames)
      }

      // Save analysis results to database
      try {
        console.log('💾 Saving analysis results to session...')
        const analysisResponse = await fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ai_evaluation: result?.analysis ? result : { analysis: result }, // normalize to object with analysis key
            status: 'completed'
          })
        })
        
        if (analysisResponse.ok) {
          const updatedSession = await analysisResponse.json()
          console.log('✅ Analysis results saved to session:', updatedSession.data)
        } else {
          const errorData = await analysisResponse.json()
          console.warn('⚠️ Failed to save analysis results:', errorData.error)
        }
      } catch (dbError) {
        console.warn('⚠️ Database error saving analysis results:', dbError)
        // Continue anyway - this is just for persistence
      }

      setStepProgress(100)
      setCurrentStep('complete')
      
      console.log('🎉 Analysis completed successfully!')

    } catch (error) {
      console.error('❌ Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
      setCurrentStep('idle')
      setStepProgress(0)
    }
  }

  const resetAnalysis = () => {
    setSelectedFile(null)
    setVideoId('')
    setCurrentStep('idle')
    setStepProgress(0)
    setAnalysisResult(null)
    setError(null)
    setKeyFrames([])
    setPatientNotes('')
    // setProcessedVideoData(null) // This state is no longer needed
    resetUpload()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getVideoUrl = () => {
    if (!videoId) return null
    
    // Use URLs from session data (database) when available
    switch (videoMode) {
      case 'original':
        // Priority: Session previdurl > Upload result > Backend fallback
        if (originalVideoUrl) {
          console.log('📹 Using session previdurl for original video:', originalVideoUrl)
          return originalVideoUrl
        }
        // Fallback to backend (shouldn't be needed)
        return `http://localhost:8001/api/video/${videoId}`
        
      case 'processed':
        // Priority: Session postvidurl > Backend stream
        if (processedVideoUrl) {
          console.log('📹 Using session postvidurl for processed video:', processedVideoUrl)
          return processedVideoUrl
        }
        // Fallback to backend stream
        return `http://localhost:8001/api/stream/${videoId}`
        
      default:
        if (originalVideoUrl) {
          return originalVideoUrl
        }
        return `http://localhost:8001/api/video/${videoId}`
    }
  }

  const getStepColor = (step: ProcessingStep) => {
    switch (step) {
      case 'uploading': return '#3b82f6'
      case 'processing_pose': return '#f59e0b'
      case 'extracting_keyframes': return '#8b5cf6'
      case 'claude_analysis': return '#06b6d4'
      case 'complete': return '#0d4a2b'
      default: return '#6b7280'
    }
  }

  // Extract exercise name from URL parameter
  const exerciseDisplayName = exerciseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div style={{ 
      flex: 1,
      backgroundColor: 'hsl(var(--background))'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '8px' }}>
        
        {/* Header with Back Navigation */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          padding: '8px 0',
          borderBottom: '1px solid hsl(var(--border))'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: 'hsl(var(--foreground))',
              marginBottom: '0'
            }}>
              {exerciseDisplayName} Analysis
            </h1>
          </div>
        </div>

        {/* Main Analysis Interface */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px',
          minHeight: '40vh'
        }}>
          
            {/* Upload Section */}
            {!videoId && !originalVideoUrl && !processedVideoUrl && sessionStatus !== 'completed' && sessionStatus !== 'feedback' && (
              <div style={{ 
                backgroundColor: 'hsl(var(--card))',
              borderRadius: '6px',
              padding: '12px',
              border: '1px solid hsl(var(--border))'
              }}>
                <h3 style={{ 
                fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: 'hsl(var(--foreground))',
                marginBottom: '8px'
                }}>
                  Upload Your Exercise Video
                </h3>
                
                <div
                  style={{
                    border: selectedFile 
                      ? '2px dashed #0d4a2b' 
                      : '2px dashed hsl(var(--border))',
                    backgroundColor: selectedFile 
                      ? 'rgba(13, 74, 43, 0.05)' 
                      : 'transparent',
                  borderRadius: '6px',
                  padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  
                  {selectedFile ? (
                    <div>
                      <CheckCircle2 style={{ width: '48px', height: '48px', color: '#0d4a2b', margin: '0 auto 16px' }} />
                      <h4 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '600', 
                        color: 'hsl(var(--foreground))',
                        marginBottom: '8px'
                      }}>
                        {selectedFile.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '16px' }}>
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Ready for analysis
                      </p>
                      <Button 
                      onClick={(e) => {
                        e.stopPropagation() // Prevent file picker from opening
                        startAnalysis()
                      }}
                      disabled={isUploading}
                        style={{ 
                          backgroundColor: '#0d4a2b',
                          gap: '8px'
                        }}
                      >
                        <Play style={{ width: '16px', height: '16px' }} />
                        Start AI Analysis
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload style={{ width: '48px', height: '48px', color: 'hsl(var(--muted-foreground))', margin: '0 auto 16px' }} />
                      <h4 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '600', 
                        color: 'hsl(var(--foreground))',
                        marginBottom: '8px'
                      }}>
                        Drop your {exerciseDisplayName.toLowerCase()} video here
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                        or click to browse • MP4, AVI, MOV supported • Max 100MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Video Display - Ultra Compact */}
            {(videoId || originalVideoUrl || processedVideoUrl) && (
              <div style={{ 
                backgroundColor: 'hsl(var(--card))',
              borderRadius: '6px',
              padding: '12px',
                border: '1px solid hsl(var(--border))'
              }}>
              <h3 style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: 'hsl(var(--foreground))',
                marginBottom: '8px'
              }}>
                Video Analysis
              </h3>

              {/* Side by Side Video Display */}
                <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '8px'
                }}>
                
                {/* Original Video */}
                <div>
                  <h4 style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    color: 'hsl(var(--foreground))',
                    marginBottom: '4px'
                  }}>
                    Original Video
                  </h4>
                  <div style={{ 
                    backgroundColor: '#000',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    aspectRatio: '4/3'
                  }}>
                    {originalVideoUrl ? (
                      <video
                        src={originalVideoUrl}
                        controls
                      style={{
                          width: '100%', 
                          height: '100%',
                          objectFit: 'contain'
                        }}
                        onLoadedData={() => {
                          console.log('✅ Original video loaded from Supabase');
                        }}
                        onError={(e) => {
                          console.error('❌ Original video failed to load:', e);
                          console.log('🔗 Attempted URL:', originalVideoUrl);
                        }}
                      />
                    ) : isLoadingVideos ? (
                      <div style={{ 
                        width: '100%', 
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <Loader2 style={{ width: '16px', height: '16px', margin: '0 auto 4px' }} className="animate-spin" />
                          <p style={{ fontSize: '0.7rem', margin: 0 }}>Loading...</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '0.7rem', margin: 0 }}>Upload video to begin</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pose Analysis Video */}
                <div>
                  <h4 style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    color: 'hsl(var(--foreground))',
                    marginBottom: '4px'
                  }}>
                    Pose Analysis
                  </h4>
                <div style={{ 
                  backgroundColor: '#000',
                    borderRadius: '4px',
                  overflow: 'hidden',
                    aspectRatio: '4/3'
                }}>
                    {processedVideoUrl ? (
                    <video
                        src={processedVideoUrl}
                      controls
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'contain'
                      }}
                        onLoadedData={() => {
                          console.log('✅ Processed video loaded');
                        }}
                        onError={(e) => {
                          console.error('❌ Processed video failed to load:', e);
                          console.log('🔗 Attempted URL:', processedVideoUrl);
                      }}
                    />
                    ) : currentStep === 'complete' ? (
                      <div style={{ 
                        width: '100%', 
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '0.7rem', margin: 0 }}>Processing complete, video not available</p>
                        </div>
                      </div>
                    ) : currentStep === 'idle' ? (
                      <div style={{ 
                        width: '100%', 
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '0.7rem', margin: 0 }}>Pose analysis will appear here</p>
                        </div>
                      </div>
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                          <Loader2 style={{ width: '14px', height: '14px', margin: '0 auto 3px' }} className="animate-spin" />
                          <p style={{ fontSize: '0.7rem', margin: 0 }}>Generating...</p>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                gap: '6px'
                }}>
                  <Button 
                    onClick={resetAnalysis}
                    variant="outline"
                  size="sm"
                  style={{ gap: '3px', fontSize: '0.7rem', padding: '4px 8px' }}
                  >
                    Upload New Video
                  </Button>
                  {currentStep === 'complete' && videoId && (
                    <Button
                      variant="outline"
                    size="sm"
                    style={{ gap: '3px', fontSize: '0.7rem', padding: '4px 8px' }}
                      asChild
                    >
                      <a href={`http://localhost:8001/api/download/${videoId}`} download>
                      <Download style={{ width: '10px', height: '10px' }} />
                      Download
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

          {/* Analysis Progress and Notes Grid */}
          {videoId && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              
              {/* Analysis Progress */}
            <div style={{ 
              backgroundColor: 'hsl(var(--card))',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid hsl(var(--border))'
            }}>
              <h3 style={{ 
                  fontSize: '0.9rem', 
                fontWeight: '600', 
                color: 'hsl(var(--foreground))',
                  marginBottom: '8px'
              }}>
                Analysis Progress
              </h3>

              {/* Troubleshooting when pose data missing */}
              {currentStep === 'complete' && analysisResult && (analysisResult as any)?.analysis_summary?.overall_health_assessment?.toLowerCase().includes('insufficient pose data') && (
                <div style={{ 
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  color: '#92400e',
                  borderRadius: '6px',
                  padding: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>No pose data captured</div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem' }}>
                    <li>Ensure good lighting and full body in frame</li>
                    <li>Place camera horizontally and stable</li>
                    <li>Wear contrasting clothing against background</li>
                    <li>Retry recording and re-upload</li>
                  </ul>
                </div>
              )}

              {/* Current Step */}
                <div style={{ marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                    gap: '6px',
                    marginBottom: '4px'
                }}>
                    {isUploading ? (
                      <Loader2 style={{ width: '12px', height: '12px', color: getStepColor(currentStep) }} className="animate-spin" />
                  ) : currentStep === 'complete' ? (
                      <CheckCircle2 style={{ width: '12px', height: '12px', color: '#0d4a2b' }} />
                    ) : currentStep !== 'idle' ? (
                      <Loader2 style={{ width: '12px', height: '12px', color: getStepColor(currentStep) }} className="animate-spin" />
                  ) : (
                      <Activity style={{ width: '12px', height: '12px', color: 'hsl(var(--muted-foreground))' }} />
                  )}
                  <span style={{ 
                      fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: currentStep === 'complete' ? '#0d4a2b' : 'hsl(var(--foreground))'
                  }}>
                    {stepLabels[currentStep]}
                  </span>
                </div>

                  {/* Overall Progress Bar */}
                  {currentStep !== 'idle' && (
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '2px'
                      }}>
                        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>
                          Overall Progress
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>
                          {(() => {
                            const steps = Object.keys(stepLabels);
                            const currentIndex = steps.indexOf(currentStep);
                            const totalSteps = steps.length - 1; // Exclude 'idle'
                            const progressPercent = currentStep === 'complete' ? 100 : Math.round((currentIndex / totalSteps) * 100);
                            return `${progressPercent}%`;
                          })()}
                        </span>
                      </div>
                  <div style={{ 
                    width: '100%', 
                    backgroundColor: 'hsl(var(--accent))', 
                        borderRadius: '3px', 
                        height: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                          height: '4px',
                          backgroundColor: currentStep === 'complete' ? '#0d4a2b' : getStepColor(currentStep),
                          borderRadius: '3px',
                          width: (() => {
                            const steps = Object.keys(stepLabels);
                            const currentIndex = steps.indexOf(currentStep);
                            const totalSteps = steps.length - 1; // Exclude 'idle'
                            return currentStep === 'complete' ? '100%' : `${Math.round((currentIndex / totalSteps) * 100)}%`;
                          })(),
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Upload Progress Bar (when uploading) */}
                  {isUploading && (
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '2px'
                      }}>
                        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>
                          Upload Progress
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>
                          {uploadProgress}%
                        </span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        backgroundColor: 'hsl(var(--accent))', 
                        borderRadius: '3px', 
                        height: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          height: '4px',
                      backgroundColor: getStepColor(currentStep),
                          borderRadius: '3px',
                          width: `${uploadProgress}%`,
                      transition: 'width 0.3s ease'
                    }} />
                      </div>
                  </div>
                )}
              </div>

              {/* Step Indicators */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(stepLabels).map(([step, label]) => {
                  const isActive = currentStep === step
                  const isCompleted = step === 'complete' && currentStep === 'complete'
                  const stepIndex = Object.keys(stepLabels).indexOf(step)
                  const currentIndex = Object.keys(stepLabels).indexOf(currentStep)
                  const isPast = stepIndex < currentIndex
                  
                  return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ 
                          width: '8px', 
                          height: '8px', 
                        borderRadius: '50%',
                        backgroundColor: isCompleted || isPast ? '#0d4a2b' : isActive ? getStepColor(step as ProcessingStep) : '#e5e7eb'
                      }} />
                      <span style={{ 
                          fontSize: '0.7rem',
                        color: isCompleted || isPast ? '#0d4a2b' : isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                        fontWeight: isActive ? '600' : '400'
                      }}>
                        {label}
                      </span>
                    </div>
                  )
                })}
            </div>

                {/* Analysis Complete Message */}
                {currentStep === 'complete' && (
              <div style={{ 
                    padding: '6px',
                    backgroundColor: 'rgba(13, 74, 43, 0.05)',
                    borderRadius: '3px',
                    fontSize: '0.75rem',
                    color: '#0d4a2b',
                    textAlign: 'center',
                    fontWeight: '500',
                    marginTop: '8px'
                  }}>
                    Analysis sent to your doctor for review
              </div>
            )}
              </div>

              {/* Doctor Feedback - only show if session status is 'feedback' AND doctor provided feedback */}
              {sessionStatus === 'feedback' && doctorFeedback && doctorFeedback.trim() && (
                <div style={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderRadius: '6px',
                  padding: '12px',
                  border: '2px solid #0d4a2b', // Green border to highlight it's from doctor
                  boxShadow: '0 0 0 1px rgba(13, 74, 43, 0.1)'
                }}>
                  <h3 style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    color: '#0d4a2b', // Green color to indicate doctor feedback
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    🩺 Feedback from Your Doctor
                  </h3>
                  <div style={{ 
                    backgroundColor: 'rgba(13, 74, 43, 0.05)', // Light green background
                    borderRadius: '4px',
                    padding: '10px',
                    border: '1px solid rgba(13, 74, 43, 0.2)',
                    fontSize: '0.8rem',
                    lineHeight: '1.4',
                    color: 'hsl(var(--foreground))',
                    whiteSpace: 'pre-wrap' // Preserve line breaks
                  }}>
                    {doctorFeedback}
                  </div>
                  <p style={{ 
                    fontSize: '0.7rem', 
                    color: 'hsl(var(--muted-foreground))',
                    marginTop: '6px',
                    marginBottom: '0',
                    fontStyle: 'italic'
                  }}>
                    This feedback is based on your analysis and will help guide your recovery.
                  </p>
                </div>
              )}

              {/* Patient Notes */}
              <div style={{ 
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid hsl(var(--border))'
              }}>
                <h3 style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: 'hsl(var(--foreground))',
                  marginBottom: '6px'
                }}>
                  Notes for Your Doctor
                </h3>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'hsl(var(--muted-foreground))',
                        marginBottom: '6px'
                      }}>
                  Add any symptoms or observations.
                </p>
                
                <textarea
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="Describe any pain or observations..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    borderRadius: '3px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                          fontSize: '0.75rem', 
                    lineHeight: '1.3',
                    resize: 'vertical',
                    marginBottom: '6px'
                  }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    onClick={async () => {
                      if (!patientNotes.trim()) return
                      
                      setIsSubmittingNotes(true)
                      try {
                        // Update session with patient notes
                        const response = await fetch(`/api/sessions/${sessionId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            patient_notes: patientNotes
                          })
                        })
                        
                        if (response.ok) {
                          console.log('✅ Patient notes saved')
                          toast({
                            title: "Success",
                            description: "Notes saved successfully!",
                            variant: "success",
                          })
                        } else {
                          throw new Error('Failed to save notes')
                        }
                      } catch (error) {
                        console.error('❌ Failed to save notes:', error)
                        toast({
                          title: "Error",
                          description: "Failed to save notes. Please try again.",
                          variant: "destructive",
                        })
                      } finally {
                        setIsSubmittingNotes(false)
                      }
                    }}
                    disabled={!patientNotes.trim() || isSubmittingNotes}
                    size="sm"
                    style={{ 
                      backgroundColor: '#0d4a2b',
                      gap: '3px',
                      fontSize: '0.7rem'
                    }}
                  >
                    {isSubmittingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                    </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
} 