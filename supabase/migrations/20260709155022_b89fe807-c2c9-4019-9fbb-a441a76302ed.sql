
CREATE TABLE public.exam_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  name text NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_terms TO authenticated;
GRANT ALL ON public.exam_terms TO service_role;
ALTER TABLE public.exam_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage exam_terms" ON public.exam_terms FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "school members view exam_terms" ON public.exam_terms FOR SELECT TO authenticated
  USING (public.get_user_school(auth.uid()) = school_id OR public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_exam_terms_updated BEFORE UPDATE ON public.exam_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.exam_terms(id) ON DELETE SET NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  exam_date date,
  max_marks numeric(6,2) NOT NULL DEFAULT 100,
  pass_marks numeric(6,2) NOT NULL DEFAULT 40,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage exams" ON public.exams FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "school members view exams" ON public.exams FOR SELECT TO authenticated
  USING (public.get_user_school(auth.uid()) = school_id OR public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_exams_updated BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.exam_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained numeric(6,2),
  grade text,
  remarks text,
  is_absent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_marks TO authenticated;
GRANT ALL ON public.exam_marks TO service_role;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff and teachers manage marks" ON public.exam_marks FOR ALL TO authenticated
  USING (
    public.is_school_staff(auth.uid(), school_id)
    OR public.is_super_admin(auth.uid())
    OR (public.has_role(auth.uid(), 'teacher') AND public.get_user_school(auth.uid()) = school_id)
  )
  WITH CHECK (
    public.is_school_staff(auth.uid(), school_id)
    OR public.is_super_admin(auth.uid())
    OR (public.has_role(auth.uid(), 'teacher') AND public.get_user_school(auth.uid()) = school_id)
  );
CREATE POLICY "school members view marks" ON public.exam_marks FOR SELECT TO authenticated
  USING (public.get_user_school(auth.uid()) = school_id OR public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_exam_marks_updated BEFORE UPDATE ON public.exam_marks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_exams_school ON public.exams(school_id);
CREATE INDEX idx_exams_class ON public.exams(class_id);
CREATE INDEX idx_exam_marks_exam ON public.exam_marks(exam_id);
CREATE INDEX idx_exam_marks_student ON public.exam_marks(student_id);
