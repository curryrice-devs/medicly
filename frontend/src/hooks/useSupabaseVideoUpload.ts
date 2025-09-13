import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';

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
  refreshVideoUrl: (storagePath: string) => Promise<string | null>;
  testBucketAccess: () => Promise<{ success: boolean; error?: string; buckets?: any[]; files?: any[] }>;
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
      console.log('🎥 Starting video upload:', { 
        filename: file.name, 
        size: file.size, 
        type: file.type 
      });
      
      // Debug: Check Supabase configuration
      console.log('🔧 Supabase config check:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
        supabaseClient: !!supabase ? '✅ Created' : '❌ Missing'
      });

      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadedVideo(null);

      // Get current user
      console.log('🔍 Getting user authentication...');
      
      const authPromise = supabase.auth.getUser();
      const authTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Authentication timeout after 5 seconds')), 5000)
      );
      
      const { data: { user }, error: userError } = await Promise.race([authPromise, authTimeout]) as any;
      
      console.log('🔍 Auth result:', { user: user?.email, error: userError?.message });
      
      if (userError) {
        console.error('❌ User authentication error:', userError);
        throw new Error(`Authentication failed: ${userError.message}`);
      }
      
      if (!user) {
        console.error('❌ No user found');
        throw new Error('You must be logged in to upload videos');
      }
      
      console.log('✅ User authenticated:', { userId: user.id, email: user.email });

      // Generate storage path with user_id
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '/');
      const randomId = crypto.randomUUID().replace(/-/g, '');
      const storagePath = options.sessionId 
        ? `user_${user.id}/sessions/${options.sessionId}/${timestamp}/${randomId}.${fileExtension}`
        : `user_${user.id}/uploads/${timestamp}/${randomId}.${fileExtension}`;
      
      console.log('📁 Generated storage path:', storagePath);

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
      console.log('⬆️ Starting upload to Supabase...');
      console.log('📋 Upload details:', {
        bucket: 'patient_videos',
        path: storagePath,
        fileSize: file.size,
        fileType: file.type
      });

      // Add timeout to prevent hanging
      const uploadPromise = await supabase
        .storage
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      );

      const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log('✅ Upload successful:', uploadData);

      // Get signed URL for private bucket
      const { data: urlData, error: urlError } = await supabase.storage
        .from('patient_videos')
        .createSignedUrl(storagePath, config.processing.signedUrlExpiry);
      
      if (urlError) {
        throw new Error(`Failed to get video URL: ${urlError.message}`);
      }

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
        console.error('❌ Database error:', dbError);
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
        storageUrl: urlData.signedUrl,
        storagePath: storagePath,
      };

      setUploadedVideo(videoData);
      
      console.log('🎉 Video upload completed successfully:', {
        videoId,
        storagePath,
        filename: file.name
      });

      if (options.onUploadComplete) {
        options.onUploadComplete(videoId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('❌ Video upload failed:', error);
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

      // Get a fresh signed URL for processing
      const { data: processingUrlData, error: processingUrlError } = await supabase.storage
        .from('patient_videos')
        .createSignedUrl(uploadedVideo.storagePath, config.processing.processingUrlExpiry);
      
      if (processingUrlError) {
        throw new Error(`Failed to get processing URL: ${processingUrlError.message}`);
      }

      // Start processing with the MediaPipe backend using the signed URL
      const response = await fetch(`${config.api.baseUrl}/api/process-supabase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: uploadedVideo.id,
          video_url: processingUrlData.signedUrl,
          storage_path: uploadedVideo.storagePath
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to start processing');
      }

      // Poll for completion
      pollProcessingStatus(uploadedVideo.id);

    } catch (error) {
      setIsProcessing(false);
      setProcessingStatus({ 
        status: 'failed', 
        message: error instanceof Error ? error.message : 'Processing failed' 
      });
      throw error;
    }
  }, [uploadedVideo, options.sessionId]);

  const pollProcessingStatus = useCallback(async (videoId: string) => {
    try {
      const response = await fetch(`${config.api.baseUrl}/api/status/${videoId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check processing status');
      }

      const status = await response.json();
      
      setProcessingStatus({
        status: status.status,
        message: status.message || 'Processing...',
        videoUrl: status.output_path ? `${config.api.baseUrl}/api/stream/${videoId}` : undefined
      });

      if (status.status === 'completed') {
        setIsProcessing(false);
        setProcessedVideoUrl(`${config.api.baseUrl}/api/stream/${videoId}`);
      } else if (status.status === 'failed' || status.status === 'error') {
        setIsProcessing(false);
      } else if (status.status === 'processing') {
        // Continue polling
        setTimeout(() => pollProcessingStatus(videoId), config.processing.pollInterval);
      }
    } catch (error) {
      console.error('Status polling error:', error);
      setIsProcessing(false);
      setProcessingStatus({ 
        status: 'failed', 
        message: 'Failed to check processing status' 
      });
    }
  }, []);

  const refreshVideoUrl = useCallback(async (storagePath: string) => {
    try {
      const { data: urlData, error: urlError } = await supabase.storage
        .from('patient_videos')
        .createSignedUrl(storagePath, config.processing.signedUrlExpiry);
      
      if (urlError) {
        throw new Error(`Failed to refresh video URL: ${urlError.message}`);
      }

      return urlData.signedUrl;
    } catch (error) {
      console.error('Failed to refresh video URL:', error);
      return null;
    }
  }, []);

  const testBucketAccess = useCallback(async () => {
    try {
      console.log('🧪 Testing bucket access...');
      
      // List buckets to see what's available
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error('❌ Failed to list buckets:', bucketsError);
        return { success: false, error: bucketsError.message };
      }
      
      console.log('📦 Available buckets:', buckets.map(b => b.name));
      
      // Check if patient_videos bucket exists
      const patientVideosBucket = buckets.find(b => b.name === 'patient_videos');
      if (!patientVideosBucket) {
        console.error('❌ patient_videos bucket not found');
        return { success: false, error: 'patient_videos bucket not found' };
      }
      
      console.log('✅ patient_videos bucket found:', patientVideosBucket);
      
      // Try to list files in the bucket
      const { data: files, error: listError } = await supabase.storage
        .from('patient_videos')
        .list('', { limit: 10 });
      
      if (listError) {
        console.error('❌ Failed to list files:', listError);
        return { success: false, error: listError.message };
      }
      
      console.log('📁 Files in bucket:', files);
      return { success: true, buckets, files };
      
    } catch (error) {
      console.error('❌ Bucket test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
    refreshVideoUrl,
    testBucketAccess,
    reset,
  };
} 