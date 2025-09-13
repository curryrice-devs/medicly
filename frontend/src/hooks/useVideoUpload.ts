import { useState, useCallback } from 'react';

interface VideoUploadOptions {
  onUploadComplete?: (videoId: string) => void;
  onUploadError?: (error: string) => void;
}

interface UploadedVideo {
  videoId: string;
  filename: string;
  size: number;
  originalUrl: string;
}

interface ProcessingStatus {
  status: 'processing' | 'completed' | 'error' | 'not_found';
  message: string;
  output_path?: string;
}

interface UseVideoUploadReturn {
  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadedVideo: UploadedVideo | null;
  
  // Processing state  
  isProcessing: boolean;
  processingStatus: ProcessingStatus | null;
  processedVideoUrl: string | null;
  
  // Actions
  uploadVideo: (file: File) => Promise<void>;
  startProcessing: () => Promise<void>;
  reset: () => void;
}

const API_BASE = 'http://localhost:8001';

export function useVideoUpload(options: VideoUploadOptions = {}): UseVideoUploadReturn {
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);

  const uploadVideo = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadedVideo(null);

      // Validate file type
      if (!file.type.startsWith('video/')) {
        throw new Error('Please select a valid video file');
      }

      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 100MB');
      }

      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      const videoData: UploadedVideo = {
        videoId: result.video_id,
        filename: result.filename || file.name,
        size: result.size || file.size,
        originalUrl: `${API_BASE}/api/video/${result.video_id}`,
      };

      setUploadedVideo(videoData);
      setUploadProgress(100);
      
      if (options.onUploadComplete) {
        options.onUploadComplete(result.video_id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      setUploadProgress(0);
      
      if (options.onUploadError) {
        options.onUploadError(errorMessage);
      }
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const startProcessing = useCallback(async () => {
    if (!uploadedVideo?.videoId) {
      throw new Error('No video uploaded');
    }

    try {
      setIsProcessing(true);
      setProcessingStatus(null);
      setProcessedVideoUrl(null);

      const response = await fetch(`${API_BASE}/api/process/${uploadedVideo.videoId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      // Start polling for status
      pollProcessingStatus(uploadedVideo.videoId);
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [uploadedVideo?.videoId]);

  const pollProcessingStatus = useCallback(async (videoId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/status/${videoId}`);
      const status: ProcessingStatus = await response.json();
      
      setProcessingStatus(status);

      if (status.status === 'completed') {
        setIsProcessing(false);
        const streamUrl = `${API_BASE}/api/stream/${videoId}`;
        setProcessedVideoUrl(streamUrl);
      } else if (status.status === 'error') {
        setIsProcessing(false);
      } else if (status.status === 'processing') {
        // Continue polling
        setTimeout(() => pollProcessingStatus(videoId), 2000);
      }
    } catch (error) {
      console.error('Status polling error:', error);
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setUploadedVideo(null);
    setIsProcessing(false);
    setProcessingStatus(null);
    setProcessedVideoUrl(null);
  }, []);

  return {
    // Upload state
    isUploading,
    uploadProgress,
    uploadError,
    uploadedVideo,
    
    // Processing state
    isProcessing,
    processingStatus,
    processedVideoUrl,
    
    // Actions
    uploadVideo,
    startProcessing,
    reset,
  };
} 