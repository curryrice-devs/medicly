'use client'

import React, { useState } from 'react'
import InputPreviewTab from './InputPreviewTab'
import ProcessingResultsTab from './ProcessingResultsTab'
import { ViewType } from './Sidebar'

interface MainContentProps {
  activeView: ViewType
  videoId: string
  originalVideoUrl: string
  processedVideoUrl: string
  onVideoProcessed: (videoId: string) => void
}

const MainContent: React.FC<MainContentProps> = ({ 
  activeView, 
  videoId, 
  originalVideoUrl, 
  processedVideoUrl, 
  onVideoProcessed 
}) => {
  const [currentVideoId, setCurrentVideoId] = useState(videoId)

  const handleVideoProcessed = (newVideoId: string) => {
    setCurrentVideoId(newVideoId)
    onVideoProcessed(newVideoId)
  }

  const renderContent = () => {
    switch (activeView) {
      case 'input':
        return (
          <InputPreviewTab 
            videoId={currentVideoId} 
            onVideoProcessed={handleVideoProcessed}
          />
        )
      case 'processing':
        return <ProcessingResultsTab videoId={currentVideoId} />
      default:
        return (
          <div className="p-6 text-center text-gray-500">
            Select a view from the sidebar
          </div>
        )
    }
  }

  return (
    <div className="flex-1 overflow-hidden">
      {renderContent()}
    </div>
  )
}

export default MainContent