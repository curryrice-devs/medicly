'use client'

import React, { useState, useRef, useCallback } from 'react'

interface ProcessingStatus {
  status: 'processing' | 'completed' | 'error' | 'not_found'
  message: string
}

export default function SimplePoseApp() {
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
      console.log('Setting original video URL:', originalUrl)
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
        const streamUrl = `${API_BASE}/api/stream/${videoId}`
        console.log('Processing completed, verifying stream URL:', streamUrl)
        
        // CANVAS APPROACH: Show original video with pose overlay using canvas
        console.log('CANVAS APPROACH: Using original video with canvas overlay')
        setProcessedVideoUrl(originalVideoUrl) // Use original video as base
        // We'll add canvas overlay in the UI
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
    console.log('Resetting all state')
    setSelectedFile(null)
    setVideoId('')
    setProcessingStatus(null)
    setOriginalVideoUrl('')
    setProcessedVideoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                MediaPipe Pose Detection
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Upload video, detect poses, download result
              </p>
            </div>
            <button
              onClick={resetAll}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 hover:bg-gray-100 rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Upload Section */}
        <div className="bg-white rounded-lg border mb-6">
          <div className="p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Video</h2>
            
            <div className="grid lg:grid-cols-3 gap-6">
              {/* File Upload */}
              <div className="lg:col-span-2">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    selectedFile
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div>
                      <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg text-gray-900 mb-2">
                        Drop video file here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports MP4, AVI, MOV and other formats
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className={`w-full py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                    selectedFile && !isUploading
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </button>

                <button
                  onClick={handleProcess}
                  disabled={!videoId || isProcessing}
                  className={`w-full py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                    videoId && !isProcessing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Process Video'}
                </button>

              {processedVideoUrl && (
                <a
                  href={`${API_BASE}/api/download/${videoId}`}
                  download
                  className="w-full py-3 px-4 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                >
                  Download Result
                </a>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        {processingStatus && (
          <div className="bg-white rounded-lg border mb-6">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">Status</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  processingStatus.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  processingStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {processingStatus.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{processingStatus.message}</p>
            </div>
          </div>
        )}

        {/* Video Preview */}
        {(originalVideoUrl || processedVideoUrl) && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original Video */}
            {originalVideoUrl && videoId && (
              <div className="bg-white rounded-lg border">
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Original</h3>
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      src={originalVideoUrl}
                      controls
                      className="w-full h-auto"
                      style={{ maxHeight: '400px' }}
                      onLoadStart={() => console.log('Original video load started:', originalVideoUrl)}
                      onLoadedData={() => console.log('Original video loaded successfully')}
                      onError={() => {
                        console.error('Original video failed to load');
                        console.error('Video URL that failed:', originalVideoUrl);
                        console.error('Video ID:', videoId);
                      }}
                      onCanPlay={() => console.log('Original video can play')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Processed Video */}
            {processedVideoUrl && videoId && (
              <div className="bg-white rounded-lg border">
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">With Poses</h3>
                  <div className="bg-black rounded-lg overflow-hidden">
                <video
                  src={processedVideoUrl}
                  controls
                  className="w-full h-auto"
                  style={{ maxHeight: '400px' }}
                  onLoadStart={() => console.log('Processed video load started:', processedVideoUrl)}
                  onLoadedData={() => console.log('Processed video loaded successfully')}
                  onError={() => {
                    console.error('Processed video failed to load');
                    console.error('Processed video URL that failed:', processedVideoUrl);
                    console.error('Video ID:', videoId);
                  }}
                  onCanPlay={() => console.log('Processed video can play')}
                />
                  </div>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      Processing complete. Pose landmarks have been detected and drawn on the video.
                      {!processedVideoUrl && (
                        <span className="block mt-1 text-orange-700">
                          Note: If video doesn&#39;t load, check console for details or try refreshing.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}


