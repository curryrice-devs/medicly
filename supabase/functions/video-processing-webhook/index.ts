// Supabase Edge Function for handling video processing webhooks
// This function receives notifications from the MediaPipe backend when video processing completes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VideoProcessingWebhook {
  video_id: string
  status: 'completed' | 'failed'
  processed_video_path?: string
  analysis_data?: {
    pose_landmarks: any[]
    joint_angles: Record<string, number>
    quality_score: number
    frame_count: number
    poses_detected: number
  }
  error_message?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const webhookData: VideoProcessingWebhook = await req.json()
    
    console.log('Video processing webhook received:', webhookData)

    // Validate required fields
    if (!webhookData.video_id || !webhookData.status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: video_id, status' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (webhookData.status === 'completed') {
      // Update video processing status to completed
      const { error: updateError } = await supabaseClient
        .rpc('complete_video_processing', {
          video_id: webhookData.video_id,
          processed_path: webhookData.processed_video_path || null,
          analysis_result: webhookData.analysis_data || null
        })

      if (updateError) {
        console.error('Failed to update video processing status:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update video status' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get session info for history entry
      const { data: videoData, error: videoError } = await supabaseClient
        .from('session_videos')
        .select(`
          id,
          session_id,
          original_filename,
          sessions!inner(title)
        `)
        .eq('id', webhookData.video_id)
        .single()

      if (!videoError && videoData) {
        // Add session history entry
        await supabaseClient
          .rpc('add_session_history', {
            for_session_id: videoData.session_id,
            activity_type_param: 'video_uploaded',
            title_param: 'Video analysis completed',
            description_param: `Pose analysis completed for ${videoData.original_filename}`,
            notes_param: webhookData.analysis_data ? 
              `Detected poses in ${webhookData.analysis_data.poses_detected} of ${webhookData.analysis_data.frame_count} frames` : 
              null,
            metadata_param: {
              video_id: webhookData.video_id,
              analysis_summary: webhookData.analysis_data
            }
          })
      }

    } else if (webhookData.status === 'failed') {
      // Update video processing status to failed
      const { error: updateError } = await supabaseClient
        .from('session_videos')
        .update({
          upload_status: 'failed',
          processing_status: 'failed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', webhookData.video_id)

      if (updateError) {
        console.error('Failed to update video failure status:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update video status' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Add failure history entry
      const { data: videoData } = await supabaseClient
        .from('session_videos')
        .select('session_id, original_filename')
        .eq('id', webhookData.video_id)
        .single()

      if (videoData) {
        await supabaseClient
          .rpc('add_session_history', {
            for_session_id: videoData.session_id,
            activity_type_param: 'custom',
            title_param: 'Video processing failed',
            description_param: `Processing failed for ${videoData.original_filename}`,
            notes_param: webhookData.error_message || 'Unknown processing error',
            metadata_param: {
              video_id: webhookData.video_id,
              error: webhookData.error_message
            }
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Video ${webhookData.video_id} status updated to ${webhookData.status}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 