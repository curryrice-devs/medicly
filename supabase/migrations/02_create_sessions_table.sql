-- Create sessions table for therapy sessions
-- Each session represents a rehabilitation program between a patient and doctor

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'completed', 'paused')) DEFAULT 'active',
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 12,
  next_session_date TIMESTAMP WITH TIME ZONE,
  session_type TEXT NOT NULL CHECK (session_type IN ('shoulder_rehabilitation', 'lower_back_therapy', 'knee_recovery', 'general_therapy', 'custom')) DEFAULT 'general_therapy',
  goals TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sessions_patient_id_idx ON public.sessions(patient_id);
CREATE INDEX IF NOT EXISTS sessions_doctor_id_idx ON public.sessions(doctor_id);
CREATE INDEX IF NOT EXISTS sessions_status_idx ON public.sessions(status);
CREATE INDEX IF NOT EXISTS sessions_next_session_date_idx ON public.sessions(next_session_date);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sessions" ON public.sessions
  FOR SELECT USING (
    patient_id = auth.uid() OR doctor_id = auth.uid()
  );

CREATE POLICY "Doctors can create sessions" ON public.sessions
  FOR INSERT WITH CHECK (
    doctor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

CREATE POLICY "Participants can update sessions" ON public.sessions
  FOR UPDATE USING (
    patient_id = auth.uid() OR doctor_id = auth.uid()
  );

CREATE POLICY "Doctors can delete sessions" ON public.sessions
  FOR DELETE USING (
    doctor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Create function to calculate progress percentage
CREATE OR REPLACE FUNCTION calculate_session_progress(session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completed INTEGER;
  total INTEGER;
  percentage INTEGER;
BEGIN
  SELECT sessions_completed, total_sessions 
  INTO completed, total
  FROM public.sessions 
  WHERE id = session_id;
  
  IF total = 0 THEN
    RETURN 0;
  END IF;
  
  percentage := ROUND((completed::DECIMAL / total::DECIMAL) * 100);
  
  -- Update the session with calculated percentage
  UPDATE public.sessions 
  SET progress_percentage = percentage 
  WHERE id = session_id;
  
  RETURN percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-calculate progress when sessions_completed changes
CREATE OR REPLACE FUNCTION update_session_progress()
RETURNS TRIGGER AS $$
BEGIN
  NEW.progress_percentage := ROUND((NEW.sessions_completed::DECIMAL / NEW.total_sessions::DECIMAL) * 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_progress_on_update ON public.sessions;
CREATE TRIGGER calculate_progress_on_update
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  WHEN (OLD.sessions_completed != NEW.sessions_completed OR OLD.total_sessions != NEW.total_sessions)
  EXECUTE FUNCTION update_session_progress(); 