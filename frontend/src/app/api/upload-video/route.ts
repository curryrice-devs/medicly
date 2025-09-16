import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractVideoRotationFromMetadata, type RotationAngle } from '@/utils/videoRotation';

// Create Supabase client for server-side operations with service role key
function createSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !serviceRoleKey) {
    return null; // Return null instead of throwing
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('📹 Starting video upload process...');
    
    const supabase = createSupabaseServer();
    
    if (!supabase) {
      console.error('❌ Failed to create Supabase client - missing environment variables');
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error: Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' 
      }, { status: 500 });
    }
    
    console.log('✅ Supabase client created successfully');
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string; // This is the patientId
    const sessionId = formData.get('sessionId') as string; // This is the case number

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Patient ID is required' 
      }, { status: 400 });
    }

    // Validate file type (only videos)
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Only video files are allowed' 
      }, { status: 400 });
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size exceeds 100MB limit' 
      }, { status: 400 });
    }

    console.log('📹 Processing video upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      patientId: userId,
      caseNumber: sessionId
    });

    // Log environment details for debugging
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV
    });

    // Detect video rotation
    let rotationAngle: RotationAngle = 0;
    try {
      rotationAngle = await extractVideoRotationFromMetadata(file);
      console.log('🔄 Detected video rotation:', rotationAngle, 'degrees');
    } catch (error) {
      console.error('⚠️  Error detecting video rotation:', error);
      // Continue with upload even if rotation detection fails
    }

    // Generate unique file path following auctor_demo pattern
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`;
    
    // Store in patient_videos bucket organized by patient ID and case/session
    // Structure: patientId/sessions/caseNumber/videoName
    // Example: 880e8f5c-faa2-42d2-95d8-e0e053962a14/sessions/80/video.mp4
    const filePath = sessionId 
      ? `${userId}/sessions/${sessionId}/${uniqueFileName}`
      : `${userId}/processed/${uniqueFileName}`;

    console.log('📁 Generated storage path (patientId/sessions/caseNumber/):', filePath);
    console.log('📁 Storage path breakdown:', {
      patientId: userId,
      sessionType: 'sessions',
      caseNumber: sessionId,
      filename: uniqueFileName,
      fullPath: filePath
    });

    // Check if bucket exists before upload
    console.log('🔍 Checking patient_videos bucket exists...');
    const bucketCheckStart = Date.now();
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    const bucketCheckTime = Date.now() - bucketCheckStart;
    console.log(`🔍 Bucket check completed in ${bucketCheckTime}ms`);
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to check storage buckets: ${bucketsError.message}` 
      }, { status: 500 });
    }
    
    console.log('📊 Found buckets:', buckets?.map(b => ({
      name: b.name,
      id: b.id,
      public: b.public,
      createdAt: b.created_at
    })) || []);

    const patientVideosBucket = buckets?.find(bucket => bucket.name === 'patient_videos');
    if (!patientVideosBucket) {
      console.error('❌ patient_videos bucket does not exist');
      console.error('Available buckets:', buckets?.map(b => b.name) || []);
      return NextResponse.json({ 
        success: false, 
        error: 'Storage bucket "patient_videos" not found. Please run the Supabase setup SQL.' 
      }, { status: 500 });
    }
    
    console.log('✅ patient_videos bucket exists:', {
      id: patientVideosBucket.id,
      public: patientVideosBucket.public,
      createdAt: patientVideosBucket.created_at,
      fileSizeLimit: patientVideosBucket.file_size_limit,
      allowedMimeTypes: patientVideosBucket.allowed_mime_types
    });

    // Test bucket permissions by trying to list files
    console.log('🔐 Testing bucket permissions...');
    try {
      const { data: testList, error: listError } = await supabase.storage
        .from('patient_videos')
        .list('', { limit: 1 });
      
      if (listError) {
        console.warn('⚠️ Could not list bucket contents (might indicate RLS issues):', listError);
      } else {
        console.log('✅ Bucket list permission test passed, found', testList?.length || 0, 'items');
      }
    } catch (listException) {
      console.warn('⚠️ Exception during bucket list test:', listException);
    }

    // Test if we can list files in the user's folder (to check RLS policies)
    console.log('🔐 Testing user folder permissions...');
    try {
      const userFolderPath = `${userId}`;
      const { data: userList, error: userListError } = await supabase.storage
        .from('patient_videos')
        .list(userFolderPath, { limit: 1 });
      
      if (userListError) {
        console.warn('⚠️ Could not list user folder contents:', userListError);
      } else {
        console.log('✅ User folder list permission test passed, found', userList?.length || 0, 'items');
      }
    } catch (userListException) {
      console.warn('⚠️ Exception during user folder list test:', userListException);
    }

    // Check if the file type is allowed
    const allowedTypes = patientVideosBucket.allowed_mime_types;
    if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      console.warn('⚠️ File type not in bucket allowed list:', {
        fileType: file.type,
        allowedTypes: allowedTypes
      });
    } else {
      console.log('✅ File type is allowed');
    }

    // Check file size against bucket limit
    if (patientVideosBucket.file_size_limit && file.size > patientVideosBucket.file_size_limit) {
      console.error('❌ File exceeds bucket size limit:', {
        fileSize: file.size,
        bucketLimit: patientVideosBucket.file_size_limit
      });
      return NextResponse.json({ 
        success: false, 
        error: `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds bucket limit of ${(patientVideosBucket.file_size_limit / (1024 * 1024)).toFixed(1)}MB` 
      }, { status: 400 });
    }

    // Test upload with a small file first to check if it's a size issue
    console.log('🧪 Testing upload capability with small file...');
    try {
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testPath = `${userId}/test_${Date.now()}.txt`;
      
      const { data: testUploadData, error: testUploadError } = await supabase.storage
        .from('patient_videos')
        .upload(testPath, testBlob, {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (testUploadError) {
        console.warn('⚠️ Small file test upload failed:', testUploadError);
      } else {
        console.log('✅ Small file test upload succeeded:', testUploadData);
        
        // Clean up test file
        try {
          await supabase.storage.from('patient_videos').remove([testPath]);
          console.log('🧹 Test file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up test file:', cleanupError);
        }
      }
    } catch (testException) {
      console.warn('⚠️ Exception during test upload:', testException);
    }

    // Upload File directly to Supabase storage (more efficient for large files)
    console.log('⬆️ Uploading to Supabase storage bucket: patient_videos');
    console.log(`📊 File details: ${(file.size / (1024 * 1024)).toFixed(1)}MB, ${file.type}`);
    
    // Retry logic for network failures (EPIPE, connection issues)
    let uploadData = null;
    let uploadError = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`, {
        filePath,
        fileSize: file.size,
        contentType: file.type,
        upsert: attempt > 1
      });
      
      const uploadStart = Date.now();
      
      try {
        const result = await supabase.storage
          .from('patient_videos')
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: attempt > 1, // Allow overwrite on retry attempts
          });
        
        const uploadDuration = Date.now() - uploadStart;
        console.log(`⏱️ Upload attempt ${attempt} took ${uploadDuration}ms`);
        
        uploadData = result.data;
        uploadError = result.error;
        
        if (!uploadError) {
          console.log(`✅ Upload successful on attempt ${attempt}`, {
            uploadTime: uploadDuration,
            resultData: uploadData
          });
          break;
        }
        
        console.log(`❌ Upload attempt ${attempt} failed after ${uploadDuration}ms:`, {
          errorName: uploadError.name,
          errorMessage: uploadError.message,
          errorCause: (uploadError as any).originalError?.cause?.code,
          errorErrno: (uploadError as any).originalError?.cause?.errno
        });
        
      } catch (uploadException) {
        const uploadDuration = Date.now() - uploadStart;
        console.log(`💥 Upload attempt ${attempt} threw exception after ${uploadDuration}ms:`, uploadException);
        uploadError = { message: `Exception: ${uploadException}`, name: 'UploadException' } as any;
      }
      
      // Check if this is a retryable error
      const isRetryable = uploadError.message.includes('fetch failed') || 
                         uploadError.message.includes('EPIPE') ||
                         uploadError.message.includes('network') ||
                         uploadError.message.includes('timeout');
      
      console.log(`🔍 Error analysis for attempt ${attempt}:`, {
        isRetryable,
        errorMessage: uploadError.message,
        willRetry: isRetryable && attempt < maxRetries
      });
      
      if (!isRetryable || attempt === maxRetries) {
        console.log(`❌ Upload failed permanently on attempt ${attempt}`);
        break;
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    if (uploadError) {
      console.error('❌ Supabase upload error after all retries:', uploadError);
      console.error('❌ Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        path: filePath,
        fileSize: file.size,
        contentType: file.type
      });
      
      // Provide specific error messages based on error type
      let userMessage = 'Failed to upload file to storage';
      
      if (uploadError.message.includes('fetch failed') || uploadError.message.includes('EPIPE')) {
        userMessage = 'Network connection interrupted during upload. Please check your internet connection and try again.';
      } else if (uploadError.message.includes('timeout')) {
        userMessage = 'Upload timed out. The file may be too large or your connection is slow.';
      } else if (uploadError.message.includes('permission') || uploadError.message.includes('forbidden')) {
        userMessage = 'Permission denied. Please contact support.';
      } else if (uploadError.message.includes('quota') || uploadError.message.includes('limit')) {
        userMessage = 'Storage quota exceeded. Please contact support.';
      }
      
      return NextResponse.json({ 
        success: false, 
        error: userMessage,
        details: uploadError.message // For debugging
      }, { status: 500 });
    }

    console.log('✅ File uploaded to Supabase Storage:', uploadData);

    // Ensure uploadData exists (TypeScript safety)
    if (!uploadData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Upload succeeded but no data returned from storage' 
      }, { status: 500 });
    }

    // Get signed URL for private bucket (following auctor_demo pattern for private files)
    console.log('🔗 Creating signed URL for uploaded file...');
    const urlStart = Date.now();
    const { data: urlData, error: urlError } = await supabase.storage
      .from('patient_videos')
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours
    
    const urlDuration = Date.now() - urlStart;
    
    if (urlError) {
      console.error('❌ Error creating signed URL:', urlError);
      console.error('❌ Signed URL error after', urlDuration, 'ms');
      // Continue without signed URL - we can create it later if needed
    } else {
      console.log('✅ Signed URL created successfully in', urlDuration, 'ms:', {
        hasSignedUrl: !!urlData?.signedUrl,
        urlLength: urlData?.signedUrl?.length || 0
      });
    }

    // Generate video ID
    const videoId = crypto.randomUUID();
    console.log('🆔 Generated video ID:', videoId);

    const responseData = {
      id: videoId,
      key: uploadData.path,
      path: uploadData.path,
      url: urlData?.signedUrl || null,
      signedUrl: urlData?.signedUrl || null,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storagePath: filePath,
      userId,
      sessionId
    };

    console.log('✅ Upload process completed successfully! Returning response:', {
      ...responseData,
      signedUrl: responseData.signedUrl ? '[SIGNED_URL_PRESENT]' : null // Don't log full URL
    });

    // Return success response following auctor_demo pattern
    return NextResponse.json({
      success: true,
      data: {
        id: videoId,
        key: uploadData.path,
        path: uploadData.path,
        url: urlData?.signedUrl || null,
        signedUrl: urlData?.signedUrl || null,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath: filePath,
        userId,
        sessionId,
        rotation: rotationAngle,
        metadata: {
          rotation: rotationAngle,
          needsCorrection: rotationAngle !== 0,
          detectedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Upload API error:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error during upload: ${errorMessage}` 
    }, { status: 500 });
  }
}

// Handle other HTTP methods - also serves as a health check
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing Supabase environment variables',
        details: 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
      }, { status: 500 });
    }

    // Test bucket access
    const { data: buckets, error } = await supabase.storage.listBuckets();
    const hasPatientVideos = buckets?.some(bucket => bucket.name === 'patient_videos');

    return NextResponse.json({ 
      success: true,
      message: 'Upload API is ready',
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        bucketExists: hasPatientVideos,
        totalBuckets: buckets?.length || 0
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 