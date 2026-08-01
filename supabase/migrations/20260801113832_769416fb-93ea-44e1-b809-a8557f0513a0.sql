-- ============ ENUMS ============
CREATE TYPE public.homework_type AS ENUM ('homework','assignment','project');
CREATE TYPE public.submission_status AS ENUM ('pending','submitted','late','graded','missing');
CREATE TYPE public.leave_status AS ENUM ('pending','approved','rejected','cancelled');
CREATE TYPE public.behaviour_type AS ENUM ('positive','concern','incident');

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.get_teacher_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.teachers WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_student_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.students WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.parents WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_parent_of_student(_user_id uuid, _student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_parents sp
    JOIN public.parents p ON p.id = sp.parent_id
    WHERE p.user_id = _user_id AND sp.student_id = _student_id
  );
$$;

-- ============ TEACHER ASSIGNMENTS ============
CREATE TABLE public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_class_teacher boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.teacher_teaches_class(_user_id uuid, _class_id uuid, _section_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_assignments ta
    JOIN public.teachers t ON t.id = ta.teacher_id
    WHERE t.user_id = _user_id
      AND ta.class_id = _class_id
      AND (_section_id IS NULL OR ta.section_id IS NULL OR ta.section_id = _section_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.teacher_teaches_student(_user_id uuid, _student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.teacher_assignments ta ON ta.class_id = s.class_id
    JOIN public.teachers t ON t.id = ta.teacher_id
    WHERE t.user_id = _user_id
      AND s.id = _student_id
      AND (ta.section_id IS NULL OR ta.section_id = s.section_id)
  );
$$;

CREATE POLICY "Staff manage teacher assignments" ON public.teacher_assignments
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "Teachers view own assignments" ON public.teacher_assignments
  FOR SELECT TO authenticated
  USING (teacher_id = public.get_teacher_id(auth.uid()));

-- ============ HOMEWORK ============
CREATE TABLE public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  kind public.homework_type NOT NULL DEFAULT 'homework',
  title text NOT NULL,
  instructions text,
  attachment_url text,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  max_points numeric(6,2) NOT NULL DEFAULT 100,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage homework" ON public.homework
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "Teachers manage homework for their classes" ON public.homework
  FOR ALL TO authenticated
  USING (public.teacher_teaches_class(auth.uid(), class_id, section_id))
  WITH CHECK (public.teacher_teaches_class(auth.uid(), class_id, section_id));

CREATE POLICY "Students view own class homework" ON public.homework
  FOR SELECT TO authenticated
  USING (
    is_published AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid()
        AND s.class_id = homework.class_id
        AND (homework.section_id IS NULL OR s.section_id = homework.section_id)
    )
  );

CREATE POLICY "Parents view children homework" ON public.homework
  FOR SELECT TO authenticated
  USING (
    is_published AND EXISTS (
      SELECT 1 FROM public.student_parents sp
      JOIN public.parents p ON p.id = sp.parent_id
      JOIN public.students s ON s.id = sp.student_id
      WHERE p.user_id = auth.uid()
        AND s.class_id = homework.class_id
        AND (homework.section_id IS NULL OR s.section_id = homework.section_id)
    )
  );

-- ============ HOMEWORK SUBMISSIONS ============
CREATE TABLE public.homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.submission_status NOT NULL DEFAULT 'pending',
  content text,
  file_url text,
  submitted_at timestamptz,
  points numeric(6,2),
  feedback text,
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (homework_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_submissions TO authenticated;
GRANT ALL ON public.homework_submissions TO service_role;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage submissions" ON public.homework_submissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.homework h WHERE h.id = homework_id
    AND (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), h.school_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.homework h WHERE h.id = homework_id
    AND (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), h.school_id))));

CREATE POLICY "Teachers grade submissions" ON public.homework_submissions
  FOR ALL TO authenticated
  USING (public.teacher_teaches_student(auth.uid(), student_id))
  WITH CHECK (public.teacher_teaches_student(auth.uid(), student_id));

CREATE POLICY "Students manage own submissions" ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students submit own work" ON public.homework_submissions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students update own submission" ON public.homework_submissions
  FOR UPDATE TO authenticated
  USING (student_id = public.get_student_id(auth.uid()))
  WITH CHECK (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Parents view children submissions" ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (public.is_parent_of_student(auth.uid(), student_id));

-- ============ STUDENT BEHAVIOUR ============
CREATE TABLE public.student_behaviour (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  kind public.behaviour_type NOT NULL DEFAULT 'positive',
  category text NOT NULL,
  description text,
  points integer NOT NULL DEFAULT 0,
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_behaviour TO authenticated;
GRANT ALL ON public.student_behaviour TO service_role;
ALTER TABLE public.student_behaviour ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage behaviour" ON public.student_behaviour
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "Teachers manage behaviour for their students" ON public.student_behaviour
  FOR ALL TO authenticated
  USING (public.teacher_teaches_student(auth.uid(), student_id))
  WITH CHECK (public.teacher_teaches_student(auth.uid(), student_id));

CREATE POLICY "Students view own behaviour" ON public.student_behaviour
  FOR SELECT TO authenticated
  USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Parents view children behaviour" ON public.student_behaviour
  FOR SELECT TO authenticated
  USING (public.is_parent_of_student(auth.uid(), student_id));

-- ============ LEAVE REQUESTS ============
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  leave_type text NOT NULL DEFAULT 'personal',
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage leave requests" ON public.leave_requests
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "Users view own leave requests" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "Users create own leave requests" ON public.leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users cancel own pending leave" ON public.leave_requests
  FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (requester_id = auth.uid());

-- ============ ANNOUNCEMENTS ============
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  audience public.app_role[] NOT NULL DEFAULT ARRAY[]::public.app_role[],
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  is_pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "Teachers create announcements" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher') AND school_id = public.get_user_school(auth.uid()));

CREATE POLICY "Members read announcements for their role" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    school_id = public.get_user_school(auth.uid())
    AND (
      cardinality(audience) = 0
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = ANY (announcements.audience)
      )
    )
  );

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  body text NOT NULL,
  read_at timestamptz,
  parent_message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients mark messages read" ON public.messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() OR sender_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "Senders delete own messages" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- ============ UPDATED_AT TRIGGERS ============
CREATE TRIGGER trg_teacher_assignments_updated BEFORE UPDATE ON public.teacher_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_homework_updated BEFORE UPDATE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_homework_submissions_updated BEFORE UPDATE ON public.homework_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_student_behaviour_updated BEFORE UPDATE ON public.student_behaviour
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_leave_requests_updated BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_messages_updated BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Students / parents read access to their own academic records
CREATE POLICY "Students view own record" ON public.students
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Teachers view their students" ON public.students
  FOR SELECT TO authenticated
  USING (public.teacher_teaches_student(auth.uid(), id));
