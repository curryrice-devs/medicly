-- Create session_history table for tracking session activities
-- Records all activities, notes, and milestones for each therapy session

CREATE TABLE IF NOT EXISTS public.session_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Who performed the activity
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'video_uploaded', 
    'assessment_completed', 
    'session_scheduled', 
    'session_completed',
    'progress_updated',
    'doctor_feedback',
    'task_completed',
    'milestone_reached',
    'note_added',
    'custom'
  )),
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  metadata JSONB, -- Store activity-specific data (e.g., video_id, assessment scores)
  is_milestone BOOLEAN DEFAULT FALSE, -- Mark important events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS session_history_session_id_idx ON public.session_history(session_id);
CREATE INDEX IF NOT EXISTS session_history_user_id_idx ON public.session_history(user_id);
CREATE INDEX IF NOT EXISTS session_history_activity_type_idx ON public.session_history(activity_type);
CREATE INDEX IF NOT EXISTS session_history_created_at_idx ON public.session_history(created_at DESC);
CREATE INDEX IF NOT EXISTS session_history_milestones_idx ON public.session_history(is_milestone) WHERE is_milestone = TRUE;

-- Enable RLS
ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view history from their sessions" ON public.session_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s 
      WHERE s.id = session_id 
      AND (s.patient_id = auth.uid() OR s.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Session participants can create history entries" ON public.session_history
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.sessions s 
      WHERE s.id = session_id 
      AND (s.patient_id = auth.uid() OR s.doctor_id = auth.uid())
    )
  );

-- Create function to add session history entry
CREATE OR REPLACE FUNCTION add_session_history(
  for_session_id UUID,
  activity_type_param TEXT,
  title_param TEXT,
  description_param TEXT DEFAULT NULL,
  notes_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT NULL,
  is_milestone_param BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  new_history_id UUID;
BEGIN
  INSERT INTO public.session_history (
    session_id,
    user_id,
    activity_type,
    title,
    description,
    notes,
    metadata,
    is_milestone
  ) VALUES (
    for_session_id,
    auth.uid(),
    activity_type_param,
    title_param,
    description_param,
    notes_param,
    metadata_param,
    is_milestone_param
  ) RETURNING id INTO new_history_id;
  
  RETURN new_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get session timeline
CREATE OR REPLACE FUNCTION get_session_timeline(for_session_id UUID)
RETURNS TABLE(
  id UUID,
  activity_type TEXT,
  title TEXT,
  description TEXT,
  notes TEXT,
  user_name TEXT,
  user_role TEXT,
  is_milestone BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.id,
    sh.activity_type,
    sh.title,
    sh.description,
    sh.notes,
    u.full_name as user_name,
    u.role as user_role,
    sh.is_milestone,
    sh.created_at
  FROM public.session_history sh
  JOIN public.users u ON sh.user_id = u.id
  WHERE sh.session_id = for_session_id
  ORDER BY sh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create history when video is uploaded
CREATE OR REPLACE FUNCTION create_video_upload_history()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Get user name
  SELECT full_name INTO user_name
  FROM public.users 
  WHERE id = NEW.uploaded_by;
  
  -- Create history entry
  INSERT INTO public.session_history (
    session_id,
    user_id,
    activity_type,
    title,
    description,
    metadata
  ) VALUES (
    NEW.session_id,
    NEW.uploaded_by,
    'video_uploaded',
    'Progress video uploaded',
    user_name || ' uploaded a new progress video: ' || NEW.original_filename,
    jsonb_build_object(
      'video_id', NEW.id,
      'filename', NEW.original_filename,
      'file_size', NEW.file_size
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_history_on_video_upload ON public.session_videos;
CREATE TRIGGER create_history_on_video_upload
  AFTER INSERT ON public.session_videos
  FOR EACH ROW
  EXECUTE FUNCTION create_video_upload_history(); 