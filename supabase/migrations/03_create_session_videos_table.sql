-- Create session_videos table for video uploads
-- Tracks videos uploaded for each therapy session with analysis results

CREATE TABLE IF NOT EXISTS public.session_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase storage
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  duration_seconds INTEGER,
  upload_status TEXT NOT NULL CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'completed', 'failed')) DEFAULT 'uploading',
  processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processed_video_path TEXT, -- Path to processed video with pose landmarks
  analysis_data JSONB, -- Store pose analysis results
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  doctor_reviewed BOOLEAN DEFAULT FALSE,
  doctor_feedback TEXT,
  feedback_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS session_videos_session_id_idx ON public.session_videos(session_id);
CREATE INDEX IF NOT EXISTS session_videos_uploaded_by_idx ON public.session_videos(uploaded_by);
CREATE INDEX IF NOT EXISTS session_videos_upload_status_idx ON public.session_videos(upload_status);
CREATE INDEX IF NOT EXISTS session_videos_processing_status_idx ON public.session_videos(processing_status);
CREATE INDEX IF NOT EXISTS session_videos_created_at_idx ON public.session_videos(created_at DESC);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_session_videos_updated_at ON public.session_videos;
CREATE TRIGGER update_session_videos_updated_at
  BEFORE UPDATE ON public.session_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.session_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view videos from their sessions" ON public.session_videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s 
      WHERE s.id = session_id 
      AND (s.patient_id = auth.uid() OR s.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Session participants can upload videos" ON public.session_videos
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.sessions s 
      WHERE s.id = session_id 
      AND (s.patient_id = auth.uid() OR s.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Session participants can update videos" ON public.session_videos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.sessions s 
      WHERE s.id = session_id 
      AND (s.patient_id = auth.uid() OR s.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Uploaded by user can delete videos" ON public.session_videos
  FOR DELETE USING (uploaded_by = auth.uid());

-- Create function to get video public URL
CREATE OR REPLACE FUNCTION get_video_public_url(storage_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url'), 
    '/storage/v1/object/public/patient-videos/', 
    storage_path
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark video processing as started
CREATE OR REPLACE FUNCTION start_video_processing(video_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.session_videos 
  SET 
    upload_status = 'processing',
    processing_status = 'processing',
    processing_started_at = NOW()
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark video processing as completed
CREATE OR REPLACE FUNCTION complete_video_processing(
  video_id UUID,
  processed_path TEXT,
  analysis_result JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.session_videos 
  SET 
    upload_status = 'completed',
    processing_status = 'completed',
    processed_video_path = processed_path,
    analysis_data = analysis_result,
    processing_completed_at = NOW()
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 