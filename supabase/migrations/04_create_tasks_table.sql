-- Create tasks table for upcoming tasks and reminders
-- Tasks can be associated with sessions or standalone

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE, -- Optional: link to session
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  task_type TEXT CHECK (task_type IN ('upload_video', 'assessment', 'appointment', 'exercise', 'review', 'custom')) DEFAULT 'custom',
  metadata JSONB, -- Store task-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_session_id_idx ON public.tasks(session_id);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON public.tasks(created_at DESC);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Doctors can view patient tasks from their sessions" ON public.tasks
  FOR SELECT USING (
    session_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.sessions s 
      WHERE s.id = session_id 
      AND s.doctor_id = auth.uid()
    )
  );

-- Create function to mark task as completed
CREATE OR REPLACE FUNCTION complete_task(task_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.tasks 
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = task_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get overdue tasks
CREATE OR REPLACE FUNCTION get_overdue_tasks(for_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  id UUID,
  title TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT,
  session_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.due_date,
    t.priority,
    s.title as session_title
  FROM public.tasks t
  LEFT JOIN public.sessions s ON t.session_id = s.id
  WHERE 
    t.user_id = for_user_id 
    AND t.status = 'pending'
    AND t.due_date < NOW()
  ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to auto-create video upload tasks
CREATE OR REPLACE FUNCTION create_video_upload_task(
  for_session_id UUID,
  task_due_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 week')
)
RETURNS UUID AS $$
DECLARE
  session_record RECORD;
  new_task_id UUID;
BEGIN
  -- Get session details
  SELECT * INTO session_record
  FROM public.sessions 
  WHERE id = for_session_id;
  
  -- Create task
  INSERT INTO public.tasks (
    title,
    description,
    user_id,
    session_id,
    priority,
    due_date,
    task_type
  ) VALUES (
    'Upload progress video for ' || session_record.title,
    'Record and upload a video showing your ' || session_record.title || ' exercises for doctor review.',
    session_record.patient_id,
    for_session_id,
    'high',
    task_due_date,
    'upload_video'
  ) RETURNING id INTO new_task_id;
  
  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 