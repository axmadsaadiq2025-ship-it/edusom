-- Attendance module
CREATE TYPE public.attendance_status AS ENUM ('present','absent','late','excused');

CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  notes TEXT,
  taken_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (section_id, session_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT ALL ON public.attendance_sessions TO service_role;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all attendance sessions"
  ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School staff manage their attendance sessions"
  ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "Teachers view their school attendance sessions"
  ON public.attendance_sessions FOR SELECT TO authenticated
  USING (public.get_user_school(auth.uid()) = school_id);

CREATE TRIGGER update_attendance_sessions_updated_at
  BEFORE UPDATE ON public.attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_sessions_school_date ON public.attendance_sessions(school_id, session_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all attendance records"
  ON public.attendance_records FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School staff manage their attendance records"
  ON public.attendance_records FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.attendance_sessions s
    WHERE s.id = attendance_records.session_id
      AND public.is_school_staff(auth.uid(), s.school_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.attendance_sessions s
    WHERE s.id = attendance_records.session_id
      AND public.is_school_staff(auth.uid(), s.school_id)
  ));

CREATE POLICY "School users view their attendance records"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.attendance_sessions s
    WHERE s.id = attendance_records.session_id
      AND public.get_user_school(auth.uid()) = s.school_id
  ));

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
