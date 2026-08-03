CREATE TYPE public.school_type AS ENUM ('primary','secondary','university','institute','training_center');
CREATE TYPE public.registration_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.subscription_plan AS ENUM ('starter','professional','enterprise');

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS school_code TEXT,
  ADD COLUMN IF NOT EXISTS plan public.subscription_plan NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS school_type public.school_type,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS state_region TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS schools_school_code_key ON public.schools (school_code);

CREATE TABLE public.school_registration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_name TEXT NOT NULL,
  school_type public.school_type NOT NULL,
  school_email TEXT NOT NULL,
  school_phone TEXT NOT NULL,
  website TEXT,
  country TEXT NOT NULL,
  state_region TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  street_address TEXT NOT NULL,
  postal_code TEXT,
  admin_full_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  admin_phone TEXT NOT NULL,
  admin_position TEXT NOT NULL,
  admin_user_id UUID,
  estimated_students INTEGER NOT NULL DEFAULT 0,
  estimated_teachers INTEGER NOT NULL DEFAULT 0,
  preferred_plan public.subscription_plan NOT NULL DEFAULT 'starter',
  accepted_terms BOOLEAN NOT NULL DEFAULT false,
  status public.registration_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  school_id UUID REFERENCES public.schools(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX srr_school_email_key ON public.school_registration_requests (lower(school_email));
CREATE UNIQUE INDEX srr_admin_email_key ON public.school_registration_requests (lower(admin_email));

GRANT SELECT, UPDATE, DELETE ON public.school_registration_requests TO authenticated;
GRANT ALL ON public.school_registration_requests TO service_role;

ALTER TABLE public.school_registration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view registration requests"
  ON public.school_registration_requests FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update registration requests"
  ON public.school_registration_requests FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete registration requests"
  ON public.school_registration_requests FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_srr_updated
  BEFORE UPDATE ON public.school_registration_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();