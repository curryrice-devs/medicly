import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const sessionId = formData.get('sessionId') as string;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
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
      userId,
      sessionId
    });

    // Generate unique file path following auctor_demo pattern
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`;
    
    // Store in patient_videos bucket organized by user and session
    const filePath = sessionId 
      ? `${userId}/sessions/${sessionId}/${uniqueFileName}`
      : `${userId}/${uniqueFileName}`;

    console.log('📁 Generated storage path:', filePath);

    // Convert File to ArrayBuffer for Supabase upload (following auctor_demo pattern)
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('patient_videos')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload file to storage' 
      }, { status: 500 });
    }

    console.log('✅ File uploaded to Supabase Storage:', uploadData);

    // Get signed URL for private bucket (following auctor_demo pattern for private files)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('patient_videos')
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours

    if (urlError) {
      console.error('❌ Error creating signed URL:', urlError);
      // Continue without signed URL - we can create it later if needed
    }

    // Generate video ID
    const videoId = crypto.randomUUID();

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
        sessionId
      }
    });

  } catch (error) {
    console.error('❌ Upload API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error during upload' 
    }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ 
    success: false, 
    error: 'Method not allowed' 
  }, { status: 405 });
} 