-- Create treatments table if it doesn't exist
CREATE TABLE IF NOT EXISTS treatments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  video_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE session_status_type AS ENUM ('pending', 'in_progress', 'completed', 'reviewed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES auth.users(id),
  video_id BIGINT,
  doctor_id UUID,
  status session_status_type DEFAULT 'pending',
  due_date DATE,
  ai_evaluation TEXT,
  exercise_sets SMALLINT DEFAULT 3,
  exercise_reps SMALLINT DEFAULT 10,
  exercise_weight SMALLINT,
  exercise_duration_in_weeks SMALLINT DEFAULT 4,
  exercise_frequency_daily SMALLINT DEFAULT 1,
  treatment_id BIGINT REFERENCES treatments(id)
);

-- Enable RLS
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for treatments (everyone can read)
CREATE POLICY "Treatments are viewable by everyone" ON treatments
  FOR SELECT USING (true);

-- Create policies for sessions (users can only see their own)
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Users can create their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = patient_id);

-- Insert some sample treatments if the table is empty
INSERT INTO treatments (name, description, video_link)
SELECT * FROM (VALUES
  ('Shoulder Pendulum Swings', 'Gentle pendulum exercises to improve shoulder mobility and reduce stiffness', 'https://example.com/shoulder-pendulum'),
  ('Knee Flexion', 'Controlled knee bending exercises to restore range of motion', 'https://example.com/knee-flexion'),
  ('Back Extension', 'Gentle back extension exercises to strengthen core and improve posture', 'https://example.com/back-extension'),
  ('Hip Abduction', 'Side-lying hip exercises to strengthen hip muscles', 'https://example.com/hip-abduction'),
  ('Ankle Pumps', 'Simple ankle movements to improve circulation and flexibility', 'https://example.com/ankle-pumps')
) AS v(name, description, video_link)
WHERE NOT EXISTS (SELECT 1 FROM treatments LIMIT 1);

-- Grant necessary permissions
GRANT ALL ON treatments TO authenticated;
GRANT ALL ON sessions TO authenticated;
GRANT USAGE ON SEQUENCE treatments_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE sessions_id_seq TO authenticated; 