'use client'

import React, { useState, useEffect } from 'react'
import Sidebar, { ViewType } from '@/components/Sidebar'
import MainContent from '@/components/MainContent'

interface ProcessingStatus {
  status: 'processing' | 'completed' | 'error' | 'not_found'
  message: string
}

export default function AnalyzePage() {
  const [videoId, setVideoId] = useState<string>('')
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string>('')
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string>('')
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null)
  const [activeView, setActiveView] = useState<ViewType>('input')
  const [versionInfo, setVersionInfo] = useState<any>(null)

  // Load version info on mount
  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const response = await fetch('http://localhost:8001/api/version')
        if (response.ok) {
          const data = await response.json()
          setVersionInfo(data)
        }
      } catch (error) {
        console.error('Failed to load version info:', error)
      }
    }

    loadVersionInfo()
  }, [])

  const handleVideoProcessed = (newVideoId: string) => {
    setVideoId(newVideoId)
    setOriginalVideoUrl(`http://localhost:8001/api/video/${newVideoId}`)
    setProcessedVideoUrl(`http://localhost:8001/api/stream/${newVideoId}`)
  }

  const handleViewChange = (view: ViewType) => {
    setActiveView(view)
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        versionInfo={versionInfo}
        processingStatus={processingStatus}
      />
      <MainContent
        activeView={activeView}
        videoId={videoId}
        originalVideoUrl={originalVideoUrl}
        processedVideoUrl={processedVideoUrl}
        onVideoProcessed={handleVideoProcessed}
      />
    </div>
  )
}
