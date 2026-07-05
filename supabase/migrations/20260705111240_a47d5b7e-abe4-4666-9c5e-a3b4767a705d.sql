
-- Seed table for bootstrap super admins (checked at first login)
CREATE TABLE IF NOT EXISTS public.super_admin_seeds (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.super_admin_seeds TO authenticated;
GRANT ALL ON public.super_admin_seeds TO service_role;

ALTER TABLE public.super_admin_seeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view seeds"
  ON public.super_admin_seeds FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

INSERT INTO public.super_admin_seeds (email)
VALUES (lower('Axmadsaadiq4@gmail.com'))
ON CONFLICT (email) DO NOTHING;

-- Extend handle_new_user to auto-grant super_admin from seed list
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.super_admin_seeds WHERE email = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure the trigger is attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: if this email already exists in auth.users, grant now
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
WHERE lower(u.email) IN (SELECT email FROM public.super_admin_seeds)
ON CONFLICT DO NOTHING;
