
-- Employment status enum
DO $$ BEGIN
  CREATE TYPE public.employment_status AS ENUM ('active','on_leave','suspended','terminated','resigned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: is staff at a school (owner/principal/vice_principal/registrar)
CREATE OR REPLACE FUNCTION public.is_school_staff(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND school_id = _school_id
      AND role IN ('school_owner','principal','vice_principal','registrar')
  );
$$;

-- ============ TEACHERS ============
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_code text NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  gender text,
  date_of_birth date,
  address text,
  qualification text,
  specialization text,
  years_of_experience integer DEFAULT 0,
  joining_date date,
  salary numeric(12,2),
  status public.employment_status NOT NULL DEFAULT 'active',
  avatar_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, employee_code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all teachers" ON public.teachers
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School staff manage school teachers" ON public.teachers
  FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "Teachers view own profile" ON public.teachers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_teachers_school ON public.teachers(school_id);
CREATE INDEX idx_teachers_user ON public.teachers(user_id);

-- ============ SUBJECTS ============
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all subjects" ON public.subjects
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School staff manage school subjects" ON public.subjects
  FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "School members view subjects" ON public.subjects
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school(auth.uid()));

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_subjects_school ON public.subjects(school_id);

-- ============ TEACHER_SUBJECTS ============
CREATE TABLE public.teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, subject_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_subjects TO authenticated;
GRANT ALL ON public.teacher_subjects TO service_role;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all teacher_subjects" ON public.teacher_subjects
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School staff manage teacher_subjects" ON public.teacher_subjects
  FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "School members view teacher_subjects" ON public.teacher_subjects
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school(auth.uid()));

CREATE INDEX idx_teacher_subjects_teacher ON public.teacher_subjects(teacher_id);
CREATE INDEX idx_teacher_subjects_subject ON public.teacher_subjects(subject_id);
