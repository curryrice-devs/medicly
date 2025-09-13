-- API functions and webhooks for medicly
-- These functions handle video processing, session management, and external integrations

-- Function to upload video to session
CREATE OR REPLACE FUNCTION upload_session_video(
  for_session_id UUID,
  filename TEXT,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT
)
RETURNS UUID AS $$
DECLARE
  new_video_id UUID;
  session_exists BOOLEAN;
BEGIN
  -- Check if session exists and user has access
  SELECT EXISTS(
    SELECT 1 FROM public.sessions s
    WHERE s.id = for_session_id
    AND (s.patient_id = auth.uid() OR s.doctor_id = auth.uid())
  ) INTO session_exists;
  
  IF NOT session_exists THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;
  
  -- Create video record
  INSERT INTO public.session_videos (
    session_id,
    uploaded_by,
    original_filename,
    storage_path,
    file_size,
    mime_type,
    upload_status
  ) VALUES (
    for_session_id,
    auth.uid(),
    filename,
    storage_path,
    file_size,
    mime_type,
    'uploaded'
  ) RETURNING id INTO new_video_id;
  
  RETURN new_video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's active sessions
CREATE OR REPLACE FUNCTION get_user_sessions(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  doctor_name TEXT,
  progress_percentage INTEGER,
  sessions_completed INTEGER,
  total_sessions INTEGER,
  next_session_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  session_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    d.full_name as doctor_name,
    s.progress_percentage,
    s.sessions_completed,
    s.total_sessions,
    s.next_session_date,
    s.status,
    s.session_type,
    s.created_at
  FROM public.sessions s
  JOIN public.users d ON s.doctor_id = d.id
  WHERE s.patient_id = user_id
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's pending tasks
CREATE OR REPLACE FUNCTION get_user_tasks(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  session_title TEXT,
  priority TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  task_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    s.title as session_title,
    t.priority,
    t.due_date,
    t.task_type,
    t.created_at
  FROM public.tasks t
  LEFT JOIN public.sessions s ON t.session_id = s.id
  WHERE t.user_id = user_id AND t.status = 'pending'
  ORDER BY 
    CASE t.priority
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
    END,
    t.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new session
CREATE OR REPLACE FUNCTION create_session(
  title_param TEXT,
  description_param TEXT,
  patient_id_param UUID,
  total_sessions_param INTEGER DEFAULT 12,
  session_type_param TEXT DEFAULT 'general_therapy',
  goals_param TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_session_id UUID;
  doctor_user RECORD;
BEGIN
  -- Verify that the current user is a doctor
  SELECT * INTO doctor_user
  FROM public.users 
  WHERE id = auth.uid() AND role = 'doctor';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only doctors can create sessions';
  END IF;
  
  -- Create the session
  INSERT INTO public.sessions (
    title,
    description,
    patient_id,
    doctor_id,
    total_sessions,
    session_type,
    goals
  ) VALUES (
    title_param,
    description_param,
    patient_id_param,
    auth.uid(),
    total_sessions_param,
    session_type_param,
    goals_param
  ) RETURNING id INTO new_session_id;
  
  -- Create initial history entry
  INSERT INTO public.session_history (
    session_id,
    user_id,
    activity_type,
    title,
    description,
    is_milestone
  ) VALUES (
    new_session_id,
    auth.uid(),
    'milestone_reached',
    'Session created',
    'New therapy session "' || title_param || '" created by ' || doctor_user.full_name,
    true
  );
  
  -- Create initial video upload task
  PERFORM create_video_upload_task(new_session_id, NOW() + INTERVAL '3 days');
  
  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session progress
CREATE OR REPLACE FUNCTION update_session_progress_with_history(
  session_id_param UUID,
  sessions_completed_param INTEGER,
  notes_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  session_record RECORD;
  old_progress INTEGER;
  new_progress INTEGER;
BEGIN
  -- Get current session data
  SELECT * INTO session_record
  FROM public.sessions
  WHERE id = session_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  old_progress := session_record.progress_percentage;
  
  -- Update session
  UPDATE public.sessions
  SET sessions_completed = sessions_completed_param
  WHERE id = session_id_param
  RETURNING progress_percentage INTO new_progress;
  
  -- Create history entry if progress changed significantly
  IF ABS(new_progress - old_progress) >= 10 THEN
    INSERT INTO public.session_history (
      session_id,
      user_id,
      activity_type,
      title,
      description,
      notes,
      is_milestone
    ) VALUES (
      session_id_param,
      auth.uid(),
      'progress_updated',
      'Significant progress update',
      'Progress updated from ' || old_progress || '% to ' || new_progress || '%',
      notes_param,
      new_progress >= 90 -- Mark as milestone if near completion
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 