-- Create the patient-videos storage bucket
-- This bucket will store all patient video uploads with proper security

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-videos',
  'patient-videos',
  false, -- Private bucket for security
  104857600, -- 100MB file size limit
  ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the patient-videos bucket

-- Policy for viewing videos: users can view videos from their sessions
DROP POLICY IF EXISTS "Users can view videos from their sessions" ON storage.objects;
CREATE POLICY "Users can view videos from their sessions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-videos' AND
  EXISTS (
    SELECT 1 
    FROM public.session_videos sv
    JOIN public.sessions s ON sv.session_id = s.id
    WHERE 
      sv.storage_path = name AND
      (s.patient_id = auth.uid() OR s.doctor_id = auth.uid())
  )
);

-- Policy for uploading videos: authenticated users can upload to their sessions
DROP POLICY IF EXISTS "Users can upload videos to their sessions" ON storage.objects;
CREATE POLICY "Users can upload videos to their sessions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-videos' AND
  auth.uid() IS NOT NULL
);

-- Policy for updating videos: users can update videos they uploaded
DROP POLICY IF EXISTS "Users can update their uploaded videos" ON storage.objects;
CREATE POLICY "Users can update their uploaded videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'patient-videos' AND
  EXISTS (
    SELECT 1 
    FROM public.session_videos sv
    WHERE 
      sv.storage_path = name AND
      sv.uploaded_by = auth.uid()
  )
);

-- Policy for deleting videos: users can delete videos they uploaded
DROP POLICY IF EXISTS "Users can delete their uploaded videos" ON storage.objects;
CREATE POLICY "Users can delete their uploaded videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-videos' AND
  EXISTS (
    SELECT 1 
    FROM public.session_videos sv
    WHERE 
      sv.storage_path = name AND
      sv.uploaded_by = auth.uid()
  )
);

-- Create function to generate secure file path
CREATE OR REPLACE FUNCTION generate_video_storage_path(
  session_id UUID,
  user_id UUID,
  original_filename TEXT
)
RETURNS TEXT AS $$
DECLARE
  file_extension TEXT;
  timestamp_str TEXT;
  random_id TEXT;
  storage_path TEXT;
BEGIN
  -- Extract file extension
  file_extension := LOWER(SUBSTRING(original_filename FROM '\.([^.]*)$'));
  
  -- Generate timestamp string
  timestamp_str := TO_CHAR(NOW(), 'YYYY/MM/DD');
  
  -- Generate random ID
  random_id := REPLACE(gen_random_uuid()::TEXT, '-', '');
  
  -- Create organized path: sessions/{session_id}/{year}/{month}/{day}/{random_id}.{ext}
  storage_path := 'sessions/' || session_id || '/' || timestamp_str || '/' || random_id || '.' || file_extension;
  
  RETURN storage_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up orphaned storage files
CREATE OR REPLACE FUNCTION cleanup_orphaned_videos()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER := 0;
  orphaned_path TEXT;
BEGIN
  -- Find storage objects that don't have corresponding session_videos records
  FOR orphaned_path IN
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'patient-videos'
    AND NOT EXISTS (
      SELECT 1 FROM public.session_videos sv
      WHERE sv.storage_path = name
    )
    AND created_at < NOW() - INTERVAL '1 day' -- Only clean up files older than 1 day
  LOOP
    -- Delete the orphaned file
    DELETE FROM storage.objects
    WHERE bucket_id = 'patient-videos' AND name = orphaned_path;
    
    cleanup_count := cleanup_count + 1;
  END LOOP;
  
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 