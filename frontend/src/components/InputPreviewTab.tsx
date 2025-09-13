'use client';

import React, { useState, useRef, useCallback } from 'react';

interface InputPreviewTabProps {
  videoId: string;
  onVideoProcessed: (videoId: string) => void;
}

const InputPreviewTab: React.FC<InputPreviewTabProps> = ({ videoId, onVideoProcessed }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);
      
      // Set preview URL
      const videoUrl = `http://localhost:8001/api/video/${result.video_id}`;
      setPreviewUrl(videoUrl);
      
      // Trigger video processing
      onVideoProcessed(result.video_id);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onVideoProcessed]);

  const handleAnalyze = async () => {
    if (!videoId) return;

    setIsAnalyzing(true);
    try {
      // First run pose analysis
      console.log('Starting pose analysis...');
      const processResponse = await fetch(`http://localhost:8001/api/process/${videoId}`, {
        method: 'POST',
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        throw new Error(`Pose analysis failed: ${errorText}`);
      }

      const processResult = await processResponse.json();
      console.log('Pose analysis started:', processResult);

      // Poll for processing completion
      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (!processingComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`http://localhost:8001/api/status/${videoId}`);
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          console.log('Processing status:', status);
          
          if (status.status === 'completed') {
            processingComplete = true;
          } else if (status.status === 'error') {
            throw new Error(`Processing failed: ${status.message}`);
          }
        }
        attempts++;
      }

      if (!processingComplete) {
        throw new Error('Processing timed out. Please try again.');
      }

      // Try two-stage analysis (optional - might fail if no API key)
      try {
        console.log('Starting two-stage analysis...');
        const analysisResponse = await fetch(`http://localhost:8001/api/two-stage-analysis/${videoId}`, {
          method: 'POST',
        });

        if (analysisResponse.ok) {
          const result = await analysisResponse.json();
          console.log('Analysis result:', result);
          setAnalysisResult(result);
        } else {
          console.log('Two-stage analysis not available (API key may be missing)');
          setAnalysisResult({ message: 'Pose analysis completed. Two-stage analysis requires API key.' });
        }
      } catch (analysisError) {
        console.log('Two-stage analysis failed:', analysisError);
        setAnalysisResult({ message: 'Pose analysis completed. Two-stage analysis failed.' });
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Input & Preview</h2>
        <p className="text-gray-600">Upload a video and preview the analysis results</p>
      </div>

      <div className="flex-1 flex">
        {/* Left Side - Upload & Controls */}
        <div className="w-1/2 p-6 border-r border-gray-200">
          {/* Upload Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Video</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="text-6xl">📹</div>
                <div>
                  <button
                    onClick={triggerFileUpload}
                    disabled={isUploading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Choose Video File'}
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Supports MP4, MOV, AVI formats
                </p>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Controls */}
          {videoId && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis</h3>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </button>
            </div>
          )}

          {/* Video Info */}
          {videoId && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Video Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Video ID:</strong> {videoId}</p>
                <p><strong>Status:</strong> {isAnalyzing ? 'Analyzing...' : 'Ready'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Preview & Results */}
        <div className="w-1/2 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview & Results</h3>
          
          {/* Video Preview */}
          {previewUrl && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Video Preview</h4>
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-64 object-contain"
                />
              </div>
            </div>
          )}

          {/* Analysis Results Preview */}
          {analysisResult && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Analysis Summary</h4>
              
              {analysisResult.analysis_summary && (
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Movement Type:</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {analysisResult.movement_identified || 'Unknown'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Confidence:</span>
                    <span className="ml-2 text-sm text-gray-600">
                      {Math.round((analysisResult.confidence || 0) * 100)}%
                    </span>
                  </div>

                  {analysisResult.analysis_summary.overall_health_assessment && (
                    <div>
                      <span className="font-medium text-gray-700">Assessment:</span>
                      <p className="mt-1 text-sm text-gray-600">
                        {analysisResult.analysis_summary.overall_health_assessment}
                      </p>
                    </div>
                  )}

                  {analysisResult.analysis_summary.key_concerns && (
                    <div>
                      <span className="font-medium text-gray-700">Key Concerns:</span>
                      <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                        {analysisResult.analysis_summary.key_concerns.map((concern: string, index: number) => (
                          <li key={index}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.analysis_summary.main_recommendations && (
                    <div>
                      <span className="font-medium text-gray-700">Recommendations:</span>
                      <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                        {analysisResult.analysis_summary.main_recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!previewUrl && !analysisResult && (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📹</div>
                <p>Upload a video to see preview and results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputPreviewTab;
