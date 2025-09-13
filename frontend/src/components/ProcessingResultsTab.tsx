'use client';

import React, { useState, useEffect, useRef } from 'react';
import VideoEditor from './VideoEditor';

interface ProcessingResultsTabProps {
  videoId: string;
}

type VideoMode = 'original' | 'processed' | 'overlay';
type ProcessingStep = 'idle' | 'capturing_keyframes' | 'sending_to_claude' | 'getting_overview' | 'analyzing_with_data' | 'generating_report' | 'complete';

const ProcessingResultsTab: React.FC<ProcessingResultsTabProps> = ({ videoId }) => {
  const [videoMode, setVideoMode] = useState<VideoMode>('original');
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('idle');
  const [stepProgress, setStepProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyFrames, setKeyFrames] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const stepLabels = {
    idle: 'Ready to process',
    capturing_keyframes: 'Capturing key frames from video',
    sending_to_claude: 'Sending images to Claude AI',
    getting_overview: 'Getting general movement overview',
    analyzing_with_data: 'Analyzing with pose data',
    generating_report: 'Generating health report',
    complete: 'Analysis complete'
  };

  const stepDurations = {
    capturing_keyframes: 3000,
    sending_to_claude: 2000,
    getting_overview: 2000,
    analyzing_with_data: 2000,
    generating_report: 2000
  };

  const getVideoUrl = () => {
    if (!videoId) return null;
    
    switch (videoMode) {
      case 'original':
        return `http://localhost:8001/api/video/${videoId}`;
      case 'processed':
        return `http://localhost:8001/api/stream/${videoId}`;
      case 'overlay':
        return `http://localhost:8001/api/stream/${videoId}?overlay=true`;
      default:
        return `http://localhost:8001/api/video/${videoId}`;
    }
  };

  const fetchKeyFrames = async () => {
    if (!videoId) return;
    
    try {
      // First try to get keyframes from angle data
      const angleResponse = await fetch(`http://localhost:8001/api/angle-data/${videoId}`);
      if (angleResponse.ok) {
        const angleData = await angleResponse.json();
        console.log('Angle data:', angleData);
        if (angleData.key_frames) {
          setKeyFrames(angleData.key_frames);
          return;
        }
      }
      
      // Fallback: try two-stage analysis
      const response = await fetch(`http://localhost:8001/api/two-stage-analysis/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Two-stage analysis data:', data);
        if (data.analysis && data.analysis.key_frames) {
          setKeyFrames(data.analysis.key_frames);
        } else if (data.key_frames) {
          setKeyFrames(data.key_frames);
        }
      }
    } catch (error) {
      console.log('Could not fetch keyframes:', error);
    }
  };

  useEffect(() => {
    if (videoId && analysisResult) {
      fetchKeyFrames();
    }
  }, [videoId, analysisResult]);

  const startProcessing = async () => {
    if (!videoId) return;

    setIsProcessing(true);
    setError(null);
    setCurrentStep('capturing_keyframes');
    setStepProgress(0);

    try {
      // Step 1: Capturing keyframes (simulation)
      await simulateStep('capturing_keyframes');
      
      // Step 2: Sending to Claude (simulation)
      setCurrentStep('sending_to_claude');
      setStepProgress(0);
      await simulateStep('sending_to_claude');
      
      // Step 3: Getting overview (simulation)
      setCurrentStep('getting_overview');
      setStepProgress(0);
      await simulateStep('getting_overview');
      
      // Step 4: Analyzing with data (simulation)
      setCurrentStep('analyzing_with_data');
      setStepProgress(0);
      await simulateStep('analyzing_with_data');
      
      // Step 5: Generating report (actual API call with progress)
      setCurrentStep('generating_report');
      setStepProgress(0);
      
      // Start the actual API call
      const responsePromise = fetch(`http://localhost:8001/api/two-stage-analysis/${videoId}`, {
        method: 'POST',
      });

      // Simulate progress while API call is running
      const progressInterval = setInterval(() => {
        setStepProgress(prev => {
          if (prev >= 90) return prev; // Don't go to 100% until API call completes
          return prev + Math.random() * 10; // Random increment
        });
      }, 500);

      const response = await responsePromise;
      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      // Extract the analysis from the response object
      setAnalysisResult(result.analysis || result);
      setCurrentStep('complete');
      setStepProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setCurrentStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateStep = async (step: ProcessingStep) => {
    return new Promise<void>((resolve) => {
      const duration = stepDurations[step as keyof typeof stepDurations] || 2000;
      const interval = 50;
      const increment = 100 / (duration / interval);
      
      let progress = 0;
      const timer = setInterval(() => {
        progress += increment;
        setStepProgress(Math.min(progress, 100));
        
        if (progress >= 100) {
          clearInterval(timer);
          resolve();
        }
      }, interval);
    });
  };

  const resetProcessing = () => {
    setCurrentStep('idle');
    setStepProgress(0);
    setIsProcessing(false);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing & Results</h2>
        <p className="text-gray-600">Monitor analysis progress and view detailed results</p>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Side - Video Display */}
        <div className="w-2/3 p-6 border-r border-gray-200 overflow-y-auto">
          {/* Video Toggle */}
          <div className="mb-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setVideoMode('original')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  videoMode === 'original'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setVideoMode('processed')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  videoMode === 'processed'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Processed
              </button>
              <button
                onClick={() => setVideoMode('overlay')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  videoMode === 'overlay'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overlay
              </button>
            </div>
          </div>

          {/* Video Editor */}
          {getVideoUrl() ? (
            <VideoEditor
              videoUrl={getVideoUrl()!}
              keyFrames={keyFrames}
              onFrameSelect={(frameNumber) => {
                console.log('Selected frame:', frameNumber);
              }}
            />
          ) : (
            <div className="w-full h-96 flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-2">📹</div>
                <p>No video available</p>
              </div>
            </div>
          )}

          {/* Debug: Show keyframes count */}
          {keyFrames.length > 0 && (
            <div className="mt-4 p-2 bg-blue-50 rounded text-sm">
              <strong>Debug:</strong> Found {keyFrames.length} keyframes
            </div>
          )}
        </div>

        {/* Right Side - Processing Status & Results */}
        <div className="w-1/3 p-6 overflow-y-auto">
          {/* Processing Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing</h3>
            
            {!isProcessing && currentStep === 'idle' && (
              <button
                onClick={startProcessing}
                disabled={!videoId}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Analysis
              </button>
            )}

            {isProcessing && (
              <button
                onClick={resetProcessing}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700"
              >
                Cancel Processing
              </button>
            )}

            {currentStep === 'complete' && (
              <button
                onClick={resetProcessing}
                className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700"
              >
                Reset
              </button>
            )}
          </div>

          {/* Progress Section */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Progress</h4>
            
            {/* Current Step Label */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Current Step:</p>
              <p className="text-lg font-medium text-gray-900">
                {stepLabels[currentStep]}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1 text-right">
                {Math.round(stepProgress)}%
              </p>
            </div>

            {/* Step Indicators */}
            <div className="space-y-2">
              {Object.entries(stepLabels).map(([step, label]) => {
                const isActive = currentStep === step;
                const isCompleted = step === 'complete' && currentStep === 'complete';
                const isUpcoming = Object.keys(stepLabels).indexOf(step) > Object.keys(stepLabels).indexOf(currentStep);
                
                return (
                  <div key={step} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      isActive ? 'bg-blue-600' : 
                      isCompleted ? 'bg-green-500' : 
                      'bg-gray-300'
                    }`} />
                    <span className={`text-sm ${
                      isActive ? 'text-blue-600 font-medium' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Error</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {analysisResult && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">Health Analysis Report</h4>
              
              <div className="space-y-6">
                {/* Movement Identification */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">Movement Analysis</h5>
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-sm text-blue-700">Type:</span>
                      <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {analysisResult.movement_identified || analysisResult.movement_type || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-blue-700">Confidence:</span>
                      <span className="ml-2 text-sm font-medium text-blue-800">
                        {Math.round((analysisResult.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Movement Overview */}
                {analysisResult.stage_1_movement_overview && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-2">Movement Overview</h5>
                    <p className="text-sm text-green-800 leading-relaxed">
                      {analysisResult.stage_1_movement_overview}
                    </p>
                  </div>
                )}

                {/* Health Assessment */}
                {analysisResult.analysis_summary?.overall_health_assessment && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-yellow-900 mb-2">Health Assessment</h5>
                    <p className="text-sm text-yellow-800 leading-relaxed">
                      {analysisResult.analysis_summary.overall_health_assessment}
                    </p>
                  </div>
                )}

                {/* Detailed Report */}
                {analysisResult.stage_2_detailed_report && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3">Detailed Analysis</h5>
                    <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(analysisResult.stage_2_detailed_report, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Status Message */}
                {analysisResult.message && (
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <p className="mt-1 text-sm text-gray-600">{analysisResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingResultsTab;
