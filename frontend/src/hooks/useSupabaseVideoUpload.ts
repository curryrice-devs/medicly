import { useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

interface VideoUploadOptions {
  sessionId?: string;
  onUploadComplete?: (videoId: string) => void;
  onUploadError?: (error: string) => void;
}

interface UploadedVideo {
  id: string;
  sessionId?: string;
  filename: string;
  size: number;
  storageUrl: string;
  storagePath: string;
}

interface ProcessingStatus {
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed';
  message: string;
  videoUrl?: string;
}

interface UseSupabaseVideoUploadReturn {
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

export function useSupabaseVideoUpload(options: VideoUploadOptions = {}): UseSupabaseVideoUploadReturn {
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

      // Get current user
      const supabase = supabaseBrowser();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to upload videos');
      }

      // Generate storage path with user_id
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '/');
      const randomId = crypto.randomUUID().replace(/-/g, '');
      const storagePath = options.sessionId 
        ? `user_${user.id}/sessions/${options.sessionId}/${timestamp}/${randomId}.${fileExtension}`
        : `user_${user.id}/uploads/${timestamp}/${randomId}.${fileExtension}`;

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

      // Upload to Supabase Storage with user_id metadata
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient_videos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            user_id: user.id,
            session_id: options.sessionId || '',
            uploaded_at: new Date().toISOString()
          }
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL (for signed URL if private bucket)
      const { data: urlData } = supabase.storage
        .from('patient_videos')
        .getPublicUrl(storagePath);

      let videoId: string;

      // If session-specific, create session_videos record
      if (options.sessionId) {
        const { data: videoRecord, error: dbError } = await supabase
          .rpc('upload_session_video', {
            for_session_id: options.sessionId,
            filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: storagePath
          });

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }

        videoId = videoRecord;
      } else {
        // For non-session uploads, we'll need a different approach
        videoId = crypto.randomUUID();
      }
      
      const videoData: UploadedVideo = {
        id: videoId,
        sessionId: options.sessionId,
        filename: file.name,
        size: file.size,
        storageUrl: urlData.publicUrl,
        storagePath: storagePath,
      };

      setUploadedVideo(videoData);
      
      if (options.onUploadComplete) {
        options.onUploadComplete(videoId);
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
    if (!uploadedVideo?.id) {
      throw new Error('No video uploaded');
    }

    try {
      setIsProcessing(true);
      setProcessingStatus({ 
        status: 'processing', 
        message: 'Starting pose analysis...' 
      });

      // Update video status to processing
      if (options.sessionId) {
        const { error } = await supabase
          .rpc('start_video_processing', {
            video_id: uploadedVideo.id
          });

        if (error) {
          throw new Error(`Failed to start processing: ${error.message}`);
        }
      }

      // For now, simulate processing with the existing backend
      // In a full implementation, you'd integrate with your MediaPipe backend
      const response = await fetch(`http://localhost:8001/api/process/${uploadedVideo.id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      // Poll for completion (simplified for demo)
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStatus({ 
          status: 'completed', 
          message: 'Analysis complete!',
          videoUrl: uploadedVideo.storageUrl
        });
        setProcessedVideoUrl(uploadedVideo.storageUrl);
      }, 3000);

    } catch (error) {
      setIsProcessing(false);
      setProcessingStatus({ 
        status: 'failed', 
        message: error instanceof Error ? error.message : 'Processing failed' 
      });
      throw error;
    }
  }, [uploadedVideo, options.sessionId]);

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