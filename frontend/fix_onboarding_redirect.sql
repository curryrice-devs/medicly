-- Fix the handle_new_user trigger to properly set default values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, onboarded, name)
  VALUES (
    new.id,
    'client',  -- Default role
    false,     -- Not onboarded by default
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name);
  RETURN new;
END;
$$;

-- Ensure all existing profiles have proper default values
UPDATE public.profiles 
SET 
  role = COALESCE(role, 'client'),
  onboarded = COALESCE(onboarded, false)
WHERE role IS NULL OR onboarded IS NULL;

-- Add NOT NULL constraints to prevent future issues
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'client',
ALTER COLUMN onboarded SET DEFAULT false;

-- Optional: Make role and onboarded NOT NULL if you want to enforce it
-- ALTER TABLE public.profiles 
-- ALTER COLUMN role SET NOT NULL,
-- ALTER COLUMN onboarded SET NOT NULL; 