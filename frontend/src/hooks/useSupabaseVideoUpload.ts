import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';

interface VideoUploadOptions {
  sessionId?: string;
  userId?: string; // Add user ID option
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
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      // File size validation
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }
      
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadedVideo(null);

      // Use provided user ID or fallback to default
      console.log('🔍 Using provided user ID...');
      
      const userId = options.userId || '00000000-0000-0000-0000-000000000001';
      const user = {
        id: userId,
        email: 'authenticated-user'
      };
      
      console.log('✅ Using user ID for storage:', userId);

      // Generate simple storage path with just user ID
      const randomId = crypto.randomUUID().replace(/-/g, '');
      const storagePath = `${user?.id}/${randomId}`;
      
      console.log('📁 Generated storage path:', storagePath);

      // Simulate progress updates
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            return prev;
          }
          return prev + 10;
        });
      }, 200);
      
      // Direct Supabase upload (simple approach)
      console.log('📤 Starting direct Supabase upload...');
      
      // Debug Supabase configuration
      console.log('🔍 Supabase URL from env:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🔍 Supabase client URL:', 'URL not accessible for security');
      console.log('🔍 Storage URL will be:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`);
      
      // Test direct API access
      try {
        console.log('🌐 Testing direct storage API access...');
        const testResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/bucket`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
          }
        });
        console.log('🌐 Direct API test response:', testResponse.status, testResponse.statusText);
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error('🌐 API error response:', errorText);
        }
      } catch (fetchError) {
        console.error('🌐 Direct API test failed:', fetchError);
      }
      
      // Test with a simple text blob first
      console.log('🧪 Testing with simple blob first...');
      
      // Skip the Supabase client test - it's hanging
      console.log('⚠️ Skipping Supabase client test, using direct API instead');
      
      /*
      const { data: testData, error: testError } = await supabase.storage
        .from('patient_videos')
        .upload(`test/${Date.now()}.txt`, testBlob);
      
      console.log('🧪 Test upload result:', { testData, testError });
      
      if (testError) {
        console.error('❌ Test upload failed, trying actual file anyway...', testError);
      }
      */
      
      console.log('📦 About to upload via direct API');
      console.log('📦 Storage path:', storagePath);
      console.log('📦 File:', { name: file.name, size: file.size, type: file.type });
      
      try {
        // Use direct API upload instead of Supabase client
        console.log('🚀 Using direct fetch API for upload...');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/patient_videos/${storagePath}`,
          {
            method: 'POST',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            },
            body: file
          }
        );
        
        console.log('📦 Direct upload response:', uploadResponse.status, uploadResponse.statusText);
        
        const uploadData = uploadResponse.ok ? await uploadResponse.json() : null;
        const uploadError = !uploadResponse.ok ? await uploadResponse.text() : null;
        
        console.log('✅ Upload completed:', { data: uploadData, error: uploadError });

        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        setUploadProgress(100);

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError}`);
        }
        
        console.log('✅ Upload successful:', uploadData);
        
        // Generate video ID and set upload state
        const videoId = uploadData?.Id || uploadData?.id || crypto.randomUUID();
        console.log('🆔 Video ID extraction:', {
          uploadDataId: uploadData?.Id,
          uploadDataid: uploadData?.id,
          generatedId: videoId,
          uploadData
        });
        
        // Set the uploaded video state
        const videoData: UploadedVideo = {
          id: videoId,
          sessionId: options.sessionId,
          filename: file.name,
          size: file.size,
          storageUrl: '', // Will be set after creating signed URL
          storagePath: storagePath,
        };
        
        setUploadedVideo(videoData);
        setIsUploading(false);
        
        // Call completion callback immediately - don't wait for signed URL
        if (options.onUploadComplete) {
          console.log('📞 Calling onUploadComplete with video ID:', videoId);
          try {
            options.onUploadComplete(videoId);
            console.log('✅ onUploadComplete callback executed successfully');
          } catch (callbackError) {
            console.error('❌ Error in onUploadComplete callback:', callbackError);
          }
        } else {
          console.warn('⚠️ No onUploadComplete callback provided');
        }
        
        // Create signed URL in background (don't await)
        console.log('🔗 Creating signed URL in background...');
        
        // Create signed URL immediately after upload
        const createSignedUrl = async () => {
          try {
            const { data: urlData, error: urlError } = await supabase.storage
              .from('patient_videos')
              .createSignedUrl(storagePath, config.processing.signedUrlExpiry);
            
            if (urlError) {
              console.error('❌ Signed URL error:', urlError);
              // Try using public URL as fallback
              const { data: publicUrlData } = supabase.storage
                .from('patient_videos')
                .getPublicUrl(storagePath);
              
              if (publicUrlData?.publicUrl) {
                console.log('📎 Using public URL as fallback');
                setUploadedVideo(prev => prev ? { ...prev, storageUrl: publicUrlData.publicUrl } : prev);
              }
            } else if (urlData?.signedUrl) {
              console.log('✅ Signed URL created successfully');
              // Update the video data with the signed URL
              setUploadedVideo(prev => prev ? { ...prev, storageUrl: urlData.signedUrl } : prev);
            }
          } catch (err) {
            console.error('❌ Failed to create signed URL:', err);
          }
        };
        
        // Execute in background
        createSignedUrl();
        
        return; // Exit early - don't wait for anything else
      } catch (uploadErr) {
        console.error('❌ Upload threw exception:', uploadErr);
        throw uploadErr;
      }

    } catch (error) {
      let errorMessage = 'Upload failed';

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Upload timed out. File may be too large or connection too slow.';
        } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          errorMessage = 'Network error during upload. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }

      console.error('❌ Video upload failed:', error);
      setUploadError(errorMessage);
      setUploadProgress(0);

      if (options.onUploadError) {
        options.onUploadError(errorMessage);
      }

      throw new Error(errorMessage);
    } finally {
      // Ensure cleanup always happens
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsUploading(false);
    }
  }, [options]);

  const startProcessing = useCallback(async () => {
    if (!uploadedVideo?.id) {
      throw new Error('No video uploaded');
    }

    try {
      console.log('🎬 Starting video processing for:', uploadedVideo.id);
      setIsProcessing(true);
      setProcessingStatus({ 
        status: 'processing', 
        message: 'Starting pose analysis...' 
      });

      // Update video status to processing
      if (options.sessionId) {
        console.log('📊 Updating video status in database...');
        const { error } = await supabase
          .rpc('start_video_processing', {
            video_id: uploadedVideo.id
          });

        if (error) {
          console.warn('⚠️ Failed to update video status in database:', error);
          // Don't throw here, continue with processing
        } else {
          console.log('✅ Video status updated in database');
        }
      }

      // Get a fresh signed URL for processing
      console.log('🔗 Creating fresh signed URL for processing...');
      const { data: processingUrlData, error: processingUrlError } = await supabase.storage
        .from('patient_videos')
        .createSignedUrl(uploadedVideo.storagePath, config.processing.processingUrlExpiry);
      
      if (processingUrlError) {
        throw new Error(`Failed to get processing URL: ${processingUrlError.message}`);
      }

      console.log('✅ Processing URL created successfully');

      // Start processing with the MediaPipe backend using the signed URL
      console.log('🤖 Starting MediaPipe processing...');
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
        throw new Error(errorData.detail || `Processing request failed with status ${response.status}`);
      }

      console.log('✅ Processing request sent successfully');

      // Poll for completion
      pollProcessingStatus(uploadedVideo.id);

    } catch (error) {
      console.error('❌ Processing start failed:', error);
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
      console.log('📊 Polling processing status for:', videoId);
      const response = await fetch(`${config.api.baseUrl}/api/status/${videoId}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed with status ${response.status}`);
      }

      const status = await response.json();
      console.log('📈 Processing status:', status);
      
      setProcessingStatus({
        status: status.status,
        message: status.message || 'Processing...',
        videoUrl: status.output_path ? `${config.api.baseUrl}/api/stream/${videoId}` : undefined
      });

      if (status.status === 'completed') {
        console.log('✅ Processing completed successfully');
        setIsProcessing(false);
        setProcessedVideoUrl(`${config.api.baseUrl}/api/stream/${videoId}`);
      } else if (status.status === 'failed' || status.status === 'error') {
        console.error('❌ Processing failed with status:', status.status);
        setIsProcessing(false);
      } else if (status.status === 'processing') {
        // Continue polling
        console.log('⏳ Still processing, will check again in', config.processing.pollInterval, 'ms');
        setTimeout(() => pollProcessingStatus(videoId), config.processing.pollInterval);
      }
    } catch (error) {
      console.error('❌ Status polling error:', error);
      setIsProcessing(false);
      setProcessingStatus({ 
        status: 'failed', 
        message: 'Failed to check processing status' 
      });
    }
  }, []);

  const reset = useCallback(() => {
    console.log('🔄 Resetting upload state');
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