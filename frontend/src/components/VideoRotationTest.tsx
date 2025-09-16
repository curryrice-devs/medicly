/**
 * Test component to validate video rotation detection and correction
 * This component can be used to test the video rotation functionality
 */

import React, { useState, useRef } from 'react';
import { VideoRotationInfo, detectAndCorrectVideoRotation } from '@/utils/videoRotation';

const VideoRotationTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [rotationInfo, setRotationInfo] = useState<VideoRotationInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setRotationInfo(null);
      console.log('File selected:', file.name, file.type);
    }
  };

  const analyzeRotation = async () => {
    if (!selectedFile || !videoRef.current) return;

    setIsAnalyzing(true);
    try {
      const rotationResult = await detectAndCorrectVideoRotation(selectedFile, videoRef.current);
      setRotationInfo(rotationResult);
      console.log('Rotation analysis result:', rotationResult);
    } catch (error) {
      console.error('Error analyzing video rotation:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setSelectedFile(null);
    setVideoUrl('');
    setRotationInfo(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Video Rotation Test
      </h2>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Video File
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Video Player */}
      {videoUrl && (
        <div className="mb-6">
          <div
            className="bg-black rounded-lg overflow-hidden flex items-center justify-center"
            style={{
              height: '300px',
              ...(rotationInfo?.needsCorrection ? rotationInfo.containerStyle : {})
            }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full"
              controls
              style={rotationInfo?.needsCorrection ? { transform: rotationInfo.transform } : undefined}
            />
          </div>

          {rotationInfo?.needsCorrection && (
            <div className="mt-2 text-center">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                ↻ Rotation Corrected: {rotationInfo.angle}°
              </span>
            </div>
          )}
        </div>
      )}

      {/* Analysis Controls */}
      {selectedFile && (
        <div className="mb-6 flex gap-4">
          <button
            onClick={analyzeRotation}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Rotation'}
          </button>

          <button
            onClick={resetVideo}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      )}

      {/* Rotation Information */}
      {rotationInfo && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Rotation Analysis Results
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Detected Angle:</span>
              <span className="ml-2 text-gray-900">{rotationInfo.angle}°</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Needs Correction:</span>
              <span className={`ml-2 ${rotationInfo.needsCorrection ? 'text-orange-600' : 'text-green-600'}`}>
                {rotationInfo.needsCorrection ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Applied Transform:</span>
              <span className="ml-2 font-mono text-gray-900 text-xs">
                {rotationInfo.transform}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          How to Test
        </h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Select a video file (preferably recorded on mobile in portrait mode)</li>
          <li>2. Click "Analyze Rotation" to detect rotation issues</li>
          <li>3. The video will be automatically corrected if rotation is detected</li>
          <li>4. Check the analysis results to see the detected rotation angle</li>
        </ol>
      </div>
    </div>
  );
};

export default VideoRotationTest;