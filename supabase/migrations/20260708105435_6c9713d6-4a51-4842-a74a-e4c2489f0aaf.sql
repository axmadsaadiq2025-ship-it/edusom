CREATE TABLE public.timetable_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_break BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_periods TO authenticated;
GRANT ALL ON public.timetable_periods TO service_role;
ALTER TABLE public.timetable_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage periods" ON public.timetable_periods FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "School staff manage periods" ON public.timetable_periods FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id)) WITH CHECK (public.is_school_staff(auth.uid(), school_id));
CREATE POLICY "School users view periods" ON public.timetable_periods FOR SELECT TO authenticated
  USING (public.get_user_school(auth.uid()) = school_id);
CREATE TRIGGER update_timetable_periods_updated_at BEFORE UPDATE ON public.timetable_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.timetable_periods(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  room TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_id, academic_year_id, day_of_week, period_id)
);
CREATE INDEX idx_tt_section ON public.timetable_entries(section_id);
CREATE INDEX idx_tt_teacher ON public.timetable_entries(teacher_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_entries TO authenticated;
GRANT ALL ON public.timetable_entries TO service_role;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage entries" ON public.timetable_entries FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "School staff manage entries" ON public.timetable_entries FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id)) WITH CHECK (public.is_school_staff(auth.uid(), school_id));
CREATE POLICY "School users view entries" ON public.timetable_entries FOR SELECT TO authenticated
  USING (public.get_user_school(auth.uid()) = school_id);
CREATE TRIGGER update_timetable_entries_updated_at BEFORE UPDATE ON public.timetable_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
