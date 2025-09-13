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
import { useSupabaseVideoUpload } from '@/hooks/useSupabaseVideoUpload'
import { SupabaseVideoTest } from '@/components/debug/SupabaseVideoTest'

type ProcessingStep = 'idle' | 'uploading' | 'processing_pose' | 'extracting_keyframes' | 'claude_analysis' | 'complete'
type VideoMode = 'original' | 'processed' | 'overlay'

interface AnalysisResult {
  movement_identified?: string
  confidence?: number
  stage_1_movement_overview?: string
  stage_2_detailed_report?: any
  analysis_summary?: {
    overall_health_assessment?: string
  }
  message?: string
  key_frames?: any[]
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

  const { user } = useAuth()
  
  // Debug: Check environment variables
  React.useEffect(() => {
    console.log('🔧 Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      user: user ? `✅ ${user.email}` : '❌ Not logged in'
    })
  }, [user])
  
  // Use Supabase video upload hook
  const { 
    isUploading,
    uploadProgress,
    uploadError,
    uploadedVideo,
    isProcessing,
    processingStatus,
    processedVideoUrl,
    uploadVideo,
    startProcessing,
    reset: resetUpload
  } = useSupabaseVideoUpload({
    sessionId,
    onUploadComplete: (videoId) => {
      console.log('✅ Video uploaded successfully:', videoId)
      setVideoId(videoId)
    },
    onUploadError: (error) => {
      console.error('❌ Upload failed:', error)
      setError(error)
    }
  })

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
      
      const timer = setInterval(() => {
        progress += increment
        setStepProgress(Math.min(progress, 100))
        
        if (progress >= 100) {
          clearInterval(timer)
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

    setError(null)
    setAnalysisResult(null)
    setKeyFrames([])

    try {
      console.log('🎬 Starting analysis...')
      console.log('📁 Selected file:', selectedFile.name, selectedFile.size, selectedFile.type)
      console.log('🔧 Environment check:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
        user: user ? `✅ ${user.email}` : '❌ Not logged in'
      })
      
            // Step 1: Try Supabase upload first, fallback to direct upload
      setCurrentStep('uploading')
      setStepProgress(0)
      
      let currentVideoId: string | null = null
      
      try {
        console.log('⬆️ Attempting Supabase upload...')
        console.log('📊 Upload hook state before:', { isUploading, uploadProgress, uploadError, uploadedVideo })
        
        await uploadVideo(selectedFile)
        
        console.log('📊 Upload hook state after:', { isUploading, uploadProgress, uploadError, uploadedVideo })
        
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        currentVideoId = videoId || uploadedVideo?.id || null
        console.log('✅ Supabase upload result:', { currentVideoId, uploadedVideo, videoId })
        
        if (!currentVideoId) {
          throw new Error('Supabase upload completed but no video ID received')
        }
        
      } catch (supabaseError) {
        console.error('❌ Supabase upload failed:', supabaseError)
        console.log('📊 Final upload state:', { isUploading, uploadProgress, uploadError, uploadedVideo })
       
        // Fallback to direct backend upload
        console.log('🔄 Falling back to direct backend upload...')
        const formData = new FormData()
        formData.append('file', selectedFile)

        // Simulate progress
        const progressInterval = setInterval(() => {
          setStepProgress(prev => Math.min(prev + 15, 90))
        }, 300)

        console.log('📡 Calling backend API:', 'http://localhost:8001/api/upload')
        const uploadResponse = await fetch('http://localhost:8001/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        clearInterval(progressInterval)
        setStepProgress(100)
        
        console.log('📡 Backend response status:', uploadResponse.status, uploadResponse.statusText)

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error('❌ Upload response error:', errorText)
          throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`)
        }

        const uploadResult = await uploadResponse.json()
        currentVideoId = uploadResult.video_id
        setVideoId(currentVideoId || '')
        console.log('✅ Direct upload successful:', currentVideoId)
      }
      
      if (!currentVideoId) {
        throw new Error('Upload failed - no video ID received')
      }

      // Step 2: Process poses
      setCurrentStep('processing_pose')
      setStepProgress(0)
      
      console.log('🔄 Starting pose processing for video:', currentVideoId)
      const processResponse = await fetch(`http://localhost:8001/api/process/${currentVideoId}`, {
        method: 'POST',
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
      let attempts = 0
      const maxAttempts = 30 // 30 seconds max

      while (!processingComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        attempts++
        
        try {
          const statusResponse = await fetch(`http://localhost:8001/api/status/${currentVideoId}`)
          if (statusResponse.ok) {
            const status = await statusResponse.json()
            console.log(`📊 Processing status (${attempts}/30):`, status.status, status.message)
            
            if (status.status === 'completed') {
              processingComplete = true
              console.log('✅ Pose processing completed!')
            } else if (status.status === 'error' || status.status === 'failed') {
              throw new Error(`Processing failed: ${status.message}`)
            }
            
            // Update progress based on status
            setStepProgress(Math.min((attempts / maxAttempts) * 100, 90))
          }
        } catch (statusError) {
          console.warn('⚠️ Status check failed:', statusError)
        }
      }

      if (!processingComplete) {
        throw new Error('Pose processing timed out after 30 seconds')
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
      setAnalysisResult(result)
      
      if (result.key_frames) {
        setKeyFrames(result.key_frames)
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
    resetUpload() // Reset Supabase upload state
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getVideoUrl = () => {
    if (!videoId && !uploadedVideo) return null
    
    const currentVideoId = videoId || uploadedVideo?.id
    if (!currentVideoId) return null
    
    switch (videoMode) {
      case 'original':
        return uploadedVideo?.storageUrl || `http://localhost:8001/api/video/${currentVideoId}`
      case 'processed':
        return processedVideoUrl || `http://localhost:8001/api/stream/${currentVideoId}`
      case 'overlay':
        return `http://localhost:8001/api/stream/${currentVideoId}?overlay=true`
      default:
        return uploadedVideo?.storageUrl || `http://localhost:8001/api/video/${currentVideoId}`
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 12px' }}>
        
        {/* Header with Back Navigation */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          padding: '16px 0',
          borderBottom: '1px solid hsl(var(--border))'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 'bold', 
              color: 'hsl(var(--foreground))',
              marginBottom: '4px'
            }}>
              {exerciseDisplayName} Analysis
            </h1>
          </div>
        </div>

        {/* Debug Component - Remove this after testing */}
        <SupabaseVideoTest />
        
        {/* Debug Panel */}
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          border: '1px solid #d1d5db', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '24px' 
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>
            🔧 Debug Panel
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                console.log('🧪 Testing backend connection...')
                try {
                  const response = await fetch('http://localhost:8001/api/health')
                  const data = await response.json()
                  console.log('✅ Backend health:', data)
                  alert(`Backend status: ${data.status}`)
                } catch (error) {
                  console.error('❌ Backend connection failed:', error)
                  alert('Backend connection failed - is it running on port 8001?')
                }
              }}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              Test Backend
            </button>
            <button
              onClick={() => {
                console.log('🔍 Current state:', {
                  selectedFile: selectedFile?.name,
                  videoId,
                  currentStep,
                  isUploading,
                  uploadProgress,
                  uploadError,
                  uploadedVideo: uploadedVideo?.id,
                  user: user?.email,
                  sessionId,
                  exerciseName
                })
              }}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: '#10b981', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              Log State
            </button>
            <button
              onClick={async () => {
                if (!selectedFile) {
                  alert('Please select a file first')
                  return
                }
                console.log('🧪 Testing direct upload only...')
                try {
                  const formData = new FormData()
                  formData.append('file', selectedFile)
                  const response = await fetch('http://localhost:8001/api/upload', {
                    method: 'POST',
                    body: formData,
                  })
                  const result = await response.json()
                  console.log('✅ Direct upload result:', result)
                  alert(`Direct upload success: ${result.video_id}`)
                } catch (error) {
                  console.error('❌ Direct upload failed:', error)
                  alert('Direct upload failed')
                }
              }}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: '#f59e0b', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              Test Direct Upload
            </button>
          </div>
        </div>

        {/* Main Analysis Interface */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '32px',
          minHeight: '70vh'
        }}>
          
          {/* Left Side - Video Interface */}
          <div>
            {/* Upload Section */}
            {!videoId && (
              <div style={{ 
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid hsl(var(--border))',
                marginBottom: '24px'
              }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: 'hsl(var(--foreground))',
                  marginBottom: '16px'
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
                    borderRadius: '12px',
                    padding: '32px',
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
                        onClick={startAnalysis}
                        disabled={isUploading || isProcessing}
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

            {/* Video Display */}
            {videoId && (
              <div style={{ 
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid hsl(var(--border))'
              }}>
                {/* Video Mode Toggle */}
                <div style={{ 
                  display: 'flex',
                  gap: '4px',
                  backgroundColor: 'hsl(var(--accent))',
                  borderRadius: '8px',
                  padding: '4px',
                  marginBottom: '16px'
                }}>
                  {[
                    { key: 'original', label: 'Original' },
                    { key: 'processed', label: 'With Poses' },
                    { key: 'overlay', label: 'Overlay' }
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => setVideoMode(mode.key as VideoMode)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: videoMode === mode.key ? '#0d4a2b' : 'transparent',
                        color: videoMode === mode.key ? 'white' : 'hsl(var(--muted-foreground))',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Video Player */}
                <div style={{ 
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  aspectRatio: '16/9'
                }}>
                  {getVideoUrl() ? (
                    <video
                      src={getVideoUrl()!}
                      controls
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'contain'
                      }}
                      onError={() => {
                        console.error('Video failed to load')
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <Video style={{ width: '48px', height: '48px', margin: '0 auto 12px' }} />
                        <p>Processing video...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  <Button 
                    onClick={resetAnalysis}
                    variant="outline"
                    style={{ gap: '6px' }}
                  >
                    Upload New Video
                  </Button>
                  {currentStep === 'complete' && videoId && (
                    <Button
                      variant="outline"
                      style={{ gap: '6px' }}
                      asChild
                    >
                      <a href={`http://localhost:8001/api/download/${videoId}`} download>
                        <Download style={{ width: '14px', height: '14px' }} />
                        Download Analysis
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Analysis Progress & Results */}
          <div>
            {/* Processing Status */}
            <div style={{ 
              backgroundColor: 'hsl(var(--card))',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid hsl(var(--border))',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: 'hsl(var(--foreground))',
                marginBottom: '16px'
              }}>
                Analysis Progress
              </h3>

              {/* Current Step */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  {(isUploading || isProcessing) ? (
                    <Loader2 style={{ width: '16px', height: '16px', color: getStepColor(currentStep) }} className="animate-spin" />
                  ) : currentStep === 'complete' ? (
                    <CheckCircle2 style={{ width: '16px', height: '16px', color: '#0d4a2b' }} />
                  ) : (
                    <Activity style={{ width: '16px', height: '16px', color: 'hsl(var(--muted-foreground))' }} />
                  )}
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    color: currentStep === 'complete' ? '#0d4a2b' : 'hsl(var(--foreground))'
                  }}>
                    {stepLabels[currentStep]}
                  </span>
                </div>

                {/* Progress Bar */}
                {(isUploading || isProcessing) && (
                  <div style={{ 
                    width: '100%', 
                    backgroundColor: 'hsl(var(--accent))', 
                    borderRadius: '6px', 
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '8px',
                      backgroundColor: getStepColor(currentStep),
                      borderRadius: '6px',
                      width: isUploading ? `${uploadProgress}%` : `${stepProgress}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                )}
              </div>

              {/* Step Indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(stepLabels).map(([step, label]) => {
                  const isActive = currentStep === step
                  const isCompleted = step === 'complete' && currentStep === 'complete'
                  const stepIndex = Object.keys(stepLabels).indexOf(step)
                  const currentIndex = Object.keys(stepLabels).indexOf(currentStep)
                  const isPast = stepIndex < currentIndex
                  
                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%',
                        backgroundColor: isCompleted || isPast ? '#0d4a2b' : isActive ? getStepColor(step as ProcessingStep) : '#e5e7eb'
                      }} />
                      <span style={{ 
                        fontSize: '0.8rem',
                        color: isCompleted || isPast ? '#0d4a2b' : isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                        fontWeight: isActive ? '600' : '400'
                      }}>
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Error Display */}
            {(error || uploadError) && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc2626' }}>
                    Analysis Failed
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>
                  {error || uploadError}
                </p>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResult && currentStep === 'complete' && (
              <div style={{ 
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid hsl(var(--border))'
              }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: 'hsl(var(--foreground))',
                  marginBottom: '16px'
                }}>
                  AI Analysis Results
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Movement Identification */}
                  {analysisResult.movement_identified && (
                    <div style={{ 
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <h5 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#1e40af',
                        marginBottom: '6px'
                      }}>
                        Movement Analysis
                      </h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '4px 8px',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          borderRadius: '12px',
                          color: '#1e40af',
                          fontWeight: '500'
                        }}>
                          {analysisResult.movement_identified}
                        </span>
                        {analysisResult.confidence && (
                          <span style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                            {Math.round(analysisResult.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Movement Overview */}
                  {analysisResult.stage_1_movement_overview && (
                    <div style={{ 
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <h5 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#047857',
                        marginBottom: '8px'
                      }}>
                        Movement Overview
                      </h5>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: 'hsl(var(--foreground))',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {analysisResult.stage_1_movement_overview}
                      </p>
                    </div>
                  )}

                  {/* Health Assessment */}
                  {analysisResult.analysis_summary?.overall_health_assessment && (
                    <div style={{ 
                      backgroundColor: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <h5 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#92400e',
                        marginBottom: '8px'
                      }}>
                        Health Assessment
                      </h5>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: 'hsl(var(--foreground))',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {analysisResult.analysis_summary.overall_health_assessment}
                      </p>
                    </div>
                  )}

                  {/* Detailed Report */}
                  {analysisResult.stage_2_detailed_report && (
                    <div style={{ 
                      backgroundColor: 'hsl(var(--accent))',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <h5 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: 'hsl(var(--foreground))',
                        marginBottom: '8px'
                      }}>
                        Detailed Analysis Report
                      </h5>
                      <div style={{ 
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        padding: '12px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        <pre style={{ 
                          fontSize: '0.75rem', 
                          color: 'hsl(var(--foreground))',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.4',
                          margin: 0
                        }}>
                          {JSON.stringify(analysisResult.stage_2_detailed_report, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Key Frames Info */}
                  {keyFrames.length > 0 && (
                    <div style={{ 
                      padding: '8px 12px',
                      backgroundColor: 'rgba(13, 74, 43, 0.05)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#0d4a2b'
                    }}>
                      ✓ Analyzed {keyFrames.length} key frames with Claude AI
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 