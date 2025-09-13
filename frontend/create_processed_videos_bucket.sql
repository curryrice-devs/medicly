-- Create a separate bucket for processed videos to keep them distinct from original uploads
-- This ensures better organization and prevents confusion

-- Create the processed_videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'processed_videos',
  'processed_videos', 
  false, -- Private bucket
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own processed videos
CREATE POLICY "Users can view their own processed videos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'processed_videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for doctors to view patient processed videos
CREATE POLICY "Doctors can view patient processed videos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'processed_videos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'doctor'
  )
);

-- Policy for backend service to upload processed videos (using service key)
CREATE POLICY "Service can upload processed videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'processed_videos'
);

-- Policy for backend service to update processed videos
CREATE POLICY "Service can update processed videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'processed_videos'
);

-- Add comment for documentation
COMMENT ON STORAGE.buckets IS 'processed_videos bucket stores videos that have been processed by the backend with pose estimation overlays'; 