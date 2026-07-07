
-- Parents table
CREATE TABLE public.parents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  occupation TEXT,
  address TEXT,
  national_id TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_parents_school ON public.parents(school_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parents TO authenticated;
GRANT ALL ON public.parents TO service_role;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manage parents" ON public.parents
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School staff manage parents" ON public.parents
  FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "Parents read own profile" ON public.parents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_parents_updated_at
  BEFORE UPDATE ON public.parents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Student ↔ Parent join
CREATE TABLE public.student_parents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'guardian',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, parent_id)
);
CREATE INDEX idx_student_parents_student ON public.student_parents(student_id);
CREATE INDEX idx_student_parents_parent ON public.student_parents(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_parents TO authenticated;
GRANT ALL ON public.student_parents TO service_role;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manage student_parents" ON public.student_parents
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School staff manage student_parents" ON public.student_parents
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_parents.student_id
      AND public.is_school_staff(auth.uid(), s.school_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_parents.student_id
      AND public.is_school_staff(auth.uid(), s.school_id)
  ));

CREATE POLICY "Parent read own links" ON public.student_parents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parents p
    WHERE p.id = student_parents.parent_id AND p.user_id = auth.uid()
  ));
