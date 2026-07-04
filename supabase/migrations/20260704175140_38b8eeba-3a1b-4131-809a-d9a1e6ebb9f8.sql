
-- ============================================
-- ENUM: application roles
-- ============================================
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'school_owner',
  'principal',
  'vice_principal',
  'accountant',
  'registrar',
  'teacher',
  'librarian',
  'parent',
  'student'
);

-- ============================================
-- TABLE: schools (tenant)
-- ============================================
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'Africa/Mogadishu',
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: user_roles
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, school_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER helpers (avoid RLS recursion)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_school(_user_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND school_id = _school_id
      AND role IN ('school_owner', 'principal', 'vice_principal')
  );
$$;

-- ============================================
-- RLS POLICIES: schools
-- ============================================
CREATE POLICY "Super admins manage all schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Members view their school"
  ON public.schools FOR SELECT
  TO authenticated
  USING (id = public.get_user_school(auth.uid()));

CREATE POLICY "School admins update their school"
  ON public.schools FOR UPDATE
  TO authenticated
  USING (public.is_school_admin(auth.uid(), id))
  WITH CHECK (public.is_school_admin(auth.uid(), id));

-- ============================================
-- RLS POLICIES: profiles
-- ============================================
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Super admins view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School members view co-members"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    school_id IS NOT NULL
    AND school_id = public.get_user_school(auth.uid())
  );

CREATE POLICY "Super admins manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ============================================
-- RLS POLICIES: user_roles
-- ============================================
CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins view their school roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    school_id IS NOT NULL
    AND public.is_school_admin(auth.uid(), school_id)
  );

CREATE POLICY "School admins manage their school roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    school_id IS NOT NULL
    AND public.is_school_admin(auth.uid(), school_id)
    AND role <> 'super_admin'
  )
  WITH CHECK (
    school_id IS NOT NULL
    AND public.is_school_admin(auth.uid(), school_id)
    AND role <> 'super_admin'
  );

-- ============================================
-- TABLE: invitations
-- ============================================
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX invitations_email_idx ON public.invitations(email);
CREATE INDEX invitations_token_idx ON public.invitations(token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all invitations"
  ON public.invitations FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins manage their invitations"
  ON public.invitations FOR ALL
  TO authenticated
  USING (
    school_id IS NOT NULL
    AND public.is_school_admin(auth.uid(), school_id)
  )
  WITH CHECK (
    school_id IS NOT NULL
    AND public.is_school_admin(auth.uid(), school_id)
    AND role <> 'super_admin'
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_schools_updated
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
