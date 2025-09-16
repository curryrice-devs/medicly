-- Migration: Add name column to profiles table and update trigger
-- This fixes the patient onboarding issue

-- 1. Add name column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'name') THEN
        ALTER TABLE public.profiles ADD COLUMN name text;
        RAISE NOTICE 'Added name column to profiles table';
    ELSE
        RAISE NOTICE 'Name column already exists in profiles table';
    END IF;
END $$;

-- 2. Update the handle_new_user trigger to set proper defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, onboarded, name) 
  VALUES (
    NEW.id, 
    'client', 
    false,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    onboarded = COALESCE(EXCLUDED.onboarded, profiles.onboarded);
  RETURN NEW;
END;
$$;

-- 3. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Update existing profiles that don't have names
UPDATE public.profiles 
SET name = COALESCE(
  (SELECT au.raw_user_meta_data->>'full_name' 
   FROM auth.users au 
   WHERE au.id = profiles.id),
  (SELECT au.email 
   FROM auth.users au 
   WHERE au.id = profiles.id),
  'Unknown User'
)
WHERE name IS NULL;

RAISE NOTICE 'Migration completed: Added name column and updated trigger'; 