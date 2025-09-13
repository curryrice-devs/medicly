-- Migration to add name support to profiles table
-- Run this in your Supabase SQL editor

-- 1) Add the name column if it doesn't exist (you mentioned you already added patient_name, but let's ensure it's there as 'name')
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='name') THEN
        ALTER TABLE public.profiles ADD COLUMN name text;
    END IF;
END $$;

-- 2) Update the trigger function to populate name from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Extract the name from user metadata (raw_user_meta_data->>'full_name')
  INSERT INTO public.profiles (id, name) 
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.profiles.name);
  
  RETURN new;
END;
$$;

-- 3) Update existing profiles that don't have names
-- This will populate names for existing users from their auth.users metadata
UPDATE public.profiles 
SET name = COALESCE(
  (SELECT au.raw_user_meta_data->>'full_name' FROM auth.users au WHERE au.id = profiles.id),
  (SELECT au.email FROM auth.users au WHERE au.id = profiles.id)
)
WHERE name IS NULL OR name = '';

-- 4) Add an index on name for better performance when searching
CREATE INDEX IF NOT EXISTS profiles_name_idx ON public.profiles(name);

-- 5) Update RLS policies to include name in selectable fields
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.has_role('admin'));

-- Note: The existing policy already allows reading, but let's make sure doctors can read patient names
DROP POLICY IF EXISTS "doctors can read patient profiles" ON public.profiles;
CREATE POLICY "doctors can read patient profiles" ON public.profiles
  FOR SELECT USING (public.has_role('doctor') OR id = auth.uid() OR public.has_role('admin')); 