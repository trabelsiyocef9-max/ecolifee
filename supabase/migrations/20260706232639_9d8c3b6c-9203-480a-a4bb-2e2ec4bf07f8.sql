
-- Wipe existing accounts (cascades to profiles via ON DELETE CASCADE / trigger)
DELETE FROM public.profiles;
DELETE FROM auth.users;

-- Replace age column with date_of_birth
ALTER TABLE public.profiles DROP COLUMN IF EXISTS age;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Update trigger to persist date_of_birth from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, date_of_birth)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::date
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
