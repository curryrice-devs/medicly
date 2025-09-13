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
  Users,
  Activity,
  FileText,
  Calendar
} from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"

interface ProcessingStatus {
  status: 'processing' | 'completed' | 'error' | 'not_found'
  message: string
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoId, setVideoId] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null)
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string>('')
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const API_BASE = 'http://localhost:8001'

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      setVideoId('')
      setProcessingStatus(null)
      setOriginalVideoUrl('')
      setProcessedVideoUrl('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      setVideoId(result.video_id)
      const originalUrl = `${API_BASE}/api/video/${result.video_id}`
      setOriginalVideoUrl(originalUrl)
      console.log('Upload successful:', result)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleProcess = async () => {
    if (!videoId) return

    setIsProcessing(true)
    try {
      const response = await fetch(`${API_BASE}/api/process/${videoId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Processing start failed')
      }

      pollProcessingStatus()
    } catch (error) {
      console.error('Processing error:', error)
      alert('Processing failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const pollProcessingStatus = useCallback(async () => {
    if (!videoId) return

    try {
      const response = await fetch(`${API_BASE}/api/status/${videoId}`)
      const status: ProcessingStatus = await response.json()
      
      setProcessingStatus(status)

      if (status.status === 'completed') {
        setIsProcessing(false)
        setProcessedVideoUrl(originalVideoUrl)
      } else if (status.status === 'error') {
        setIsProcessing(false)
      } else if (status.status === 'processing') {
        setTimeout(pollProcessingStatus, 2000)
      }
    } catch (error) {
      console.error('Status polling error:', error)
      setIsProcessing(false)
    }
  }, [videoId, originalVideoUrl])

  const resetAll = () => {
    setSelectedFile(null)
    setVideoId('')
    setProcessingStatus(null)
    setOriginalVideoUrl('')
    setProcessedVideoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Mock doctor dashboard stats
  const doctorStats = [
    {
      title: 'Active Patients',
      value: '24',
      icon: Users,
      description: 'Currently under care'
    },
    {
      title: 'Pending Reviews',
      value: '8',
      icon: FileText,
      description: 'Videos awaiting analysis'
    },
    {
      title: 'Sessions Today',
      value: '6',
      icon: Calendar,
      description: 'Scheduled appointments'
    },
    {
      title: 'Completed Analysis',
      value: '156',
      icon: Activity,
      description: 'This month'
    }
  ]

  return (
    <div style={{ 
      flex: 1,
      backgroundColor: 'hsl(var(--background))'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 12px' }}>
        
        {/* Welcome Header */}
        <div style={{ 
          marginBottom: '24px',
          padding: '16px 0',
          borderBottom: '1px solid hsl(var(--border))'
        }}>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: 'hsl(var(--foreground))',
            marginBottom: '4px'
          }}>
            Welcome back, Dr. {user?.name?.split(' ')[1] || user?.name?.split(' ')[0]}
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            Patient care dashboard and video analysis tools
          </p>
        </div>

        {/* Doctor Stats */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '16px' 
          }}>
            {doctorStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} style={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid hsl(var(--border))',
                  transition: 'all 0.2s ease'
                }}
                className="hover:shadow-md"
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '6px', 
                      backgroundColor: 'rgba(13, 74, 43, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon style={{ width: '16px', height: '16px', color: '#0d4a2b' }} />
                    </div>
                    <div>
                      <p style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold', 
                        color: 'hsl(var(--foreground))',
                        lineHeight: '1'
                      }}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                  <h3 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: 'hsl(var(--foreground))',
                    marginBottom: '2px'
                  }}>
                    {stat.title}
                  </h3>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'hsl(var(--muted-foreground))' 
                  }}>
                    {stat.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Video Analysis Tool */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video style={{ width: '20px', height: '20px', color: '#0d4a2b' }} />
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: 'hsl(var(--foreground))' 
              }}>
                Patient Video Analysis
              </h2>
            </div>
            <Button 
              onClick={resetAll}
              variant="outline" 
              size="sm"
            >
              Reset
            </Button>
          </div>

          <div style={{ 
            backgroundColor: 'hsl(var(--card))',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr', 
              gap: '24px',
              marginBottom: '20px'
            }}>
              {/* File Upload */}
              <div>
                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: 'hsl(var(--foreground))',
                  marginBottom: '12px'
                }}>
                  Upload Patient Video
                </h3>
                <div
                  style={{
                    border: selectedFile 
                      ? '2px dashed #0d4a2b' 
                      : '2px dashed hsl(var(--border))',
                    backgroundColor: selectedFile 
                      ? 'rgba(13, 74, 43, 0.05)' 
                      : 'transparent',
                    borderRadius: '8px',
                    padding: '24px',
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
                      <CheckCircle2 style={{ width: '32px', height: '32px', color: '#0d4a2b', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))', marginBottom: '4px' }}>
                        {selectedFile.name}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload style={{ width: '32px', height: '32px', color: 'hsl(var(--muted-foreground))', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '1rem', color: 'hsl(var(--foreground))', marginBottom: '4px' }}>
                        Drop video file here or click to browse
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                        Supports MP4, AVI, MOV and other formats
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  style={{ 
                    width: '100%',
                    backgroundColor: selectedFile && !isUploading ? '#0d4a2b' : undefined
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload style={{ width: '16px', height: '16px' }} />
                      Upload Video
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleProcess}
                  disabled={!videoId || isProcessing}
                  variant="outline"
                  style={{ width: '100%' }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play style={{ width: '16px', height: '16px' }} />
                      Analyze Movement
                    </>
                  )}
                </Button>

                {processedVideoUrl && (
                  <Button
                    variant="outline"
                    style={{ width: '100%', gap: '8px' }}
                    asChild
                  >
                    <a href={`${API_BASE}/api/download/${videoId}`} download>
                      <Download style={{ width: '16px', height: '16px' }} />
                      Download Result
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Status Section */}
            {processingStatus && (
              <div style={{ 
                padding: '16px',
                borderRadius: '6px',
                backgroundColor: processingStatus.status === 'completed' 
                  ? 'rgba(13, 74, 43, 0.05)' 
                  : processingStatus.status === 'error'
                  ? 'rgba(239, 68, 68, 0.05)'
                  : 'rgba(59, 130, 246, 0.05)',
                border: `1px solid ${
                  processingStatus.status === 'completed' 
                    ? 'rgba(13, 74, 43, 0.2)' 
                    : processingStatus.status === 'error'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)'
                }`,
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {processingStatus.status === 'completed' ? (
                    <CheckCircle2 style={{ width: '16px', height: '16px', color: '#0d4a2b' }} />
                  ) : processingStatus.status === 'error' ? (
                    <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                  ) : (
                    <Loader2 style={{ width: '16px', height: '16px', color: '#3b82f6' }} className="animate-spin" />
                  )}
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    color: processingStatus.status === 'completed' 
                      ? '#0d4a2b' 
                      : processingStatus.status === 'error'
                      ? '#dc2626'
                      : '#3b82f6'
                  }}>
                    {processingStatus.status.charAt(0).toUpperCase() + processingStatus.status.slice(1)}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'hsl(var(--foreground))',
                  margin: 0
                }}>
                  {processingStatus.message}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Video Preview */}
        {(originalVideoUrl || processedVideoUrl) && (
          <section>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: 'hsl(var(--foreground))',
              marginBottom: '16px'
            }}>
              Video Analysis Results
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: originalVideoUrl && processedVideoUrl ? '1fr 1fr' : '1fr',
              gap: '20px' 
            }}>
              {/* Original Video */}
              {originalVideoUrl && (
                <div style={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid hsl(var(--border))'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: 'hsl(var(--foreground))',
                    marginBottom: '12px'
                  }}>
                    Original Patient Video
                  </h3>
                  <div style={{ 
                    backgroundColor: '#000',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <video
                      src={originalVideoUrl}
                      controls
                      style={{ 
                        width: '100%', 
                        height: 'auto',
                        maxHeight: '400px'
                      }}
                      onError={() => {
                        console.error('Original video failed to load');
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Processed Video */}
              {processedVideoUrl && (
                <div style={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid hsl(var(--border))'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: 'hsl(var(--foreground))',
                    marginBottom: '12px'
                  }}>
                    Pose Analysis Results
                  </h3>
                  <div style={{ 
                    backgroundColor: '#000',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <video
                      src={processedVideoUrl}
                      controls
                      style={{ 
                        width: '100%', 
                        height: 'auto',
                        maxHeight: '400px'
                      }}
                      onError={() => {
                        console.error('Processed video failed to load');
                      }}
                    />
                  </div>
                  <div style={{ 
                    padding: '12px',
                    backgroundColor: 'rgba(13, 74, 43, 0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(13, 74, 43, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 style={{ width: '16px', height: '16px', color: '#0d4a2b' }} />
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#0d4a2b'
                      }}>
                        Analysis Complete
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: 'hsl(var(--foreground))',
                      marginTop: '4px',
                      margin: 0
                    }}>
                      Pose landmarks detected and overlaid on video. Green dots show joint positions with connection lines.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}