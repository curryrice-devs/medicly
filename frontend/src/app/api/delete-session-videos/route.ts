import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

interface DeleteRequest {
  sessionId: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId }: DeleteRequest = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing sessionId or userId'
      }, { status: 400 });
    }

    console.log('🗑️ Starting video deletion for session:', { sessionId, userId });

    // Initialize Supabase client
    const supabase = createSupabaseServer();

    // Get session data to find existing video URLs
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('previdurl, postvidurl')
      .eq('id', sessionId)
      .eq('patient_id', userId)
      .single();

    if (sessionError) {
      console.error('❌ Error fetching session:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Session not found or access denied'
      }, { status: 404 });
    }

    const filesToDelete: string[] = [];

    // Extract storage paths from URLs
    if (session.previdurl) {
      const previdPath = extractStoragePathFromUrl(session.previdurl, userId, sessionId);
      if (previdPath) filesToDelete.push(previdPath);
    }

    if (session.postvidurl) {
      const postvidPath = extractStoragePathFromUrl(session.postvidurl, userId, sessionId);
      if (postvidPath) filesToDelete.push(postvidPath);
    }

    // Also try to delete by expected file patterns
    // Pattern: userId/sessions/sessionId/*.mp4
    const sessionDir = `${userId}/sessions/${sessionId}`;
    console.log('🔍 Checking session directory:', sessionDir);

    // List all files in the session directory
    const { data: files, error: listError } = await supabase.storage
      .from('patient_videos')
      .list(sessionDir);

    if (!listError && files) {
      for (const file of files) {
        const fullPath = `${sessionDir}/${file.name}`;
        if (!filesToDelete.includes(fullPath)) {
          filesToDelete.push(fullPath);
        }
      }
    }

    console.log('📁 Files to delete:', filesToDelete);

    // Delete files from storage bucket
    const deletionResults = [];
    if (filesToDelete.length > 0) {
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from('patient_videos')
        .remove(filesToDelete);

      if (deleteError) {
        console.warn('⚠️ Some files could not be deleted:', deleteError);
        deletionResults.push({ error: deleteError.message, files: filesToDelete });
      } else {
        console.log('✅ Files deleted successfully:', deleteData);
        deletionResults.push({ success: true, deletedFiles: filesToDelete });
      }
    }

    // Clear video URLs from session record
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        previdurl: null,
        postvidurl: null,
        ai_evaluation: null
      })
      .eq('id', sessionId)
      .eq('patient_id', userId);

    if (updateError) {
      console.error('❌ Error clearing session URLs:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to clear session video URLs'
      }, { status: 500 });
    }

    console.log('✅ Session videos deleted and URLs cleared');

    return NextResponse.json({
      success: true,
      message: 'Session videos deleted successfully',
      deletedFiles: filesToDelete.length,
      deletionResults
    });

  } catch (error) {
    console.error('❌ Error deleting session videos:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete videos'
    }, { status: 500 });
  }
}

// Helper function to extract storage path from Supabase URL
function extractStoragePathFromUrl(url: string, userId: string, sessionId: string): string | null {
  try {
    // For Supabase URLs like: https://xxx.supabase.co/storage/v1/object/public/patient_videos/path
    if (url.includes('supabase.co/storage/v1/object')) {
      const parts = url.split('/patient_videos/');
      if (parts.length > 1) {
        return parts[1].split('?')[0]; // Remove query parameters
      }
    }
    
    // Fallback: try to construct expected path
    const urlObj = new URL(url);
    const fileName = urlObj.pathname.split('/').pop();
    if (fileName) {
      return `${userId}/sessions/${sessionId}/${fileName}`;
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️ Could not extract storage path from URL:', url, error);
    return null;
  }
}
