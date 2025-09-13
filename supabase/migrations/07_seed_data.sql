-- Seed data for medicly development and testing
-- This creates sample users, sessions, and tasks for development

-- Note: In production, users are created through authentication
-- This is for development/demo purposes only

DO $$
DECLARE
  patient_user_id UUID := gen_random_uuid();
  doctor_user_id UUID := gen_random_uuid();
  session_1_id UUID := gen_random_uuid();
  session_2_id UUID := gen_random_uuid();
  session_3_id UUID := gen_random_uuid();
BEGIN
  -- Insert demo users (only if they don't exist)
  INSERT INTO public.users (id, email, full_name, role, avatar_url) VALUES
    (patient_user_id, 'patient@demo.com', 'John Patient', 'patient', 'https://api.dicebear.com/7.x/avataaars/svg?seed=patient'),
    (doctor_user_id, 'doctor@demo.com', 'Dr. Sarah Chen', 'doctor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor')
  ON CONFLICT (email) DO NOTHING;

  -- Insert demo sessions
  INSERT INTO public.sessions (id, title, description, patient_id, doctor_id, status, progress_percentage, sessions_completed, total_sessions, next_session_date, session_type) VALUES
    (
      session_1_id,
      'Shoulder Rehabilitation',
      'Comprehensive shoulder mobility and strength recovery program following rotator cuff injury.',
      patient_user_id,
      doctor_user_id,
      'active',
      75,
      9,
      12,
      NOW() + INTERVAL '3 days',
      'shoulder_rehabilitation'
    ),
    (
      session_2_id,
      'Lower Back Therapy',
      'Lower back strengthening and flexibility program for chronic pain management.',
      patient_user_id,
      doctor_user_id,
      'active',
      45,
      5,
      11,
      NOW() + INTERVAL '6 days',
      'lower_back_therapy'
    ),
    (
      session_3_id,
      'Knee Recovery Program',
      'Post-surgical knee rehabilitation focusing on stability and mobility restoration.',
      patient_user_id,
      doctor_user_id,
      'pending',
      90,
      8,
      9,
      NOW() + INTERVAL '10 days',
      'knee_recovery'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Insert demo tasks
  INSERT INTO public.tasks (title, description, user_id, session_id, priority, due_date, task_type) VALUES
    (
      'Upload shoulder movement video',
      'Record and upload a video showing your shoulder rehabilitation exercises for doctor review.',
      patient_user_id,
      session_1_id,
      'high',
      NOW() + INTERVAL '1 day',
      'upload_video'
    ),
    (
      'Complete pain assessment form',
      'Fill out the weekly pain assessment questionnaire for your lower back therapy.',
      patient_user_id,
      session_2_id,
      'medium',
      NOW() + INTERVAL '2 days',
      'assessment'
    ),
    (
      'Schedule final evaluation',
      'Book your final evaluation appointment for the knee recovery program.',
      patient_user_id,
      session_3_id,
      'medium',
      NOW() + INTERVAL '7 days',
      'appointment'
    ),
    (
      'Review exercise instructions',
      'Review the updated exercise instructions provided by your doctor.',
      patient_user_id,
      NULL, -- Not session-specific
      'low',
      NOW() + INTERVAL '5 days',
      'review'
    )
  ON CONFLICT DO NOTHING;

  -- Insert demo session history
  INSERT INTO public.session_history (session_id, user_id, activity_type, title, description, notes, is_milestone) VALUES
    (
      session_1_id,
      patient_user_id,
      'video_uploaded',
      'Progress video uploaded',
      'Uploaded shoulder mobility exercise video',
      'Significant improvement in range of motion',
      false
    ),
    (
      session_1_id,
      doctor_user_id,
      'assessment_completed',
      'Weekly assessment completed',
      'Completed weekly progress assessment',
      'Good progress, continue current exercises',
      false
    ),
    (
      session_1_id,
      doctor_user_id,
      'milestone_reached',
      'Initial evaluation',
      'Baseline measurements and initial assessment completed',
      'Baseline measurements recorded, good foundation for recovery',
      true
    ),
    (
      session_2_id,
      doctor_user_id,
      'doctor_feedback',
      'Exercise video reviewed',
      'Reviewed patient exercise form and technique',
      'Form corrections needed, provided updated instructions',
      false
    ),
    (
      session_2_id,
      patient_user_id,
      'assessment_completed',
      'Pain assessment completed',
      'Completed weekly pain level assessment',
      NULL,
      false
    ),
    (
      session_3_id,
      doctor_user_id,
      'milestone_reached',
      'Excellent progress noted',
      'Patient showing excellent recovery progress',
      'Ready for final evaluation phase',
      true
    )
  ON CONFLICT DO NOTHING;

END $$;

-- Create view for easy session data retrieval
CREATE OR REPLACE VIEW session_details AS
SELECT 
  s.*,
  p.full_name as patient_name,
  p.email as patient_email,
  d.full_name as doctor_name,
  d.email as doctor_email,
  (
    SELECT COUNT(*)
    FROM public.session_videos sv
    WHERE sv.session_id = s.id AND sv.upload_status = 'completed'
  ) as total_videos,
  (
    SELECT COUNT(*)
    FROM public.tasks t
    WHERE t.session_id = s.id AND t.status = 'pending'
  ) as pending_tasks
FROM public.sessions s
JOIN public.users p ON s.patient_id = p.id
JOIN public.users d ON s.doctor_id = d.id;

-- Grant access to the view
GRANT SELECT ON session_details TO authenticated; 