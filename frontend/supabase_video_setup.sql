-- Supabase Video Storage Setup
-- This file sets up the video storage bucket and related functions

-- 1. Create the patient_videos storage bucket
-- IMPORTANT: Storage buckets need to be created with proper permissions

-- First, ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the bucket using a function that handles permissions properly
DO $$
BEGIN
    -- Create the bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'patient_videos',
        'patient_videos', 
        false, -- private bucket
        104857600, -- 100MB limit (100 * 1024 * 1024 bytes)
        ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo']
    )
    ON CONFLICT (id) DO UPDATE SET
        file_size_limit = 104857600,
        allowed_mime_types = ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'];
    
    RAISE NOTICE 'Storage bucket "patient_videos" created/updated successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating bucket: %', SQLERRM;
        RAISE NOTICE 'You may need to create the bucket manually in the Supabase dashboard';
        RAISE NOTICE 'Go to Storage -> Create bucket -> Name: patient_videos, Private: true';
END $$;

-- 2. Create storage policies for the patient_videos bucket

-- Allow authenticated users to upload videos to their own folder
DROP POLICY IF EXISTS "Users can upload videos to own folder" ON storage.objects;
CREATE POLICY "Users can upload videos to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'patient_videos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = ('user_' || auth.uid()::text)
);

-- Allow users to view their own videos
DROP POLICY IF EXISTS "Users can view own videos" ON storage.objects;
CREATE POLICY "Users can view own videos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'patient_videos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = ('user_' || auth.uid()::text)
);

-- Allow users to update their own videos (for metadata updates)
DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'patient_videos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = ('user_' || auth.uid()::text)
);

-- Allow users to delete their own videos
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'patient_videos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = ('user_' || auth.uid()::text)
);

-- 3. Create a simple videos table to track uploaded videos (optional)
CREATE TABLE IF NOT EXISTS public.videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id text, -- optional session identifier
    filename text NOT NULL,
    file_size bigint NOT NULL,
    mime_type text NOT NULL,
    storage_path text NOT NULL,
    status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on videos table
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Users can only see their own videos
DROP POLICY IF EXISTS "Users can view own videos" ON public.videos;
CREATE POLICY "Users can view own videos"
ON public.videos FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own videos
DROP POLICY IF EXISTS "Users can insert own videos" ON public.videos;
CREATE POLICY "Users can insert own videos"
ON public.videos FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own videos
DROP POLICY IF EXISTS "Users can update own videos" ON public.videos;
CREATE POLICY "Users can update own videos"
ON public.videos FOR UPDATE
USING (user_id = auth.uid());

-- 4. Create RPC function to handle video upload
CREATE OR REPLACE FUNCTION public.upload_session_video(
    for_session_id text,
    filename text,
    file_size bigint,
    mime_type text,
    storage_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    video_id uuid;
BEGIN
    -- Insert video record
    INSERT INTO public.videos (
        user_id,
        session_id,
        filename,
        file_size,
        mime_type,
        storage_path,
        status
    ) VALUES (
        auth.uid(),
        for_session_id,
        filename,
        file_size,
        mime_type,
        storage_path,
        'uploaded'
    ) RETURNING id INTO video_id;
    
    RETURN video_id;
END;
$$;

-- 5. Create RPC function to start video processing
CREATE OR REPLACE FUNCTION public.start_video_processing(
    video_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update video status to processing
    UPDATE public.videos 
    SET status = 'processing', updated_at = now()
    WHERE id = video_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Video not found or access denied';
    END IF;
END;
$$;

-- 6. Create function to update video processing status
CREATE OR REPLACE FUNCTION public.update_video_status(
    video_id uuid,
    new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate status
    IF new_status NOT IN ('uploaded', 'processing', 'completed', 'failed') THEN
        RAISE EXCEPTION 'Invalid status: %', new_status;
    END IF;
    
    -- Update video status
    UPDATE public.videos 
    SET status = new_status, updated_at = now()
    WHERE id = video_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Video not found or access denied';
    END IF;
END;
$$;

-- 7. Create function to get video by ID
CREATE OR REPLACE FUNCTION public.get_video(
    video_id uuid
)
RETURNS TABLE (
    id uuid,
    session_id text,
    filename text,
    file_size bigint,
    mime_type text,
    storage_path text,
    status text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.session_id, v.filename, v.file_size, v.mime_type, 
           v.storage_path, v.status, v.created_at
    FROM public.videos v
    WHERE v.id = video_id AND v.user_id = auth.uid();
END;
$$; 