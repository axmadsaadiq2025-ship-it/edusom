-- 1. exam_marks: scope teachers to their assigned class/section and subject
CREATE OR REPLACE FUNCTION public.teacher_can_manage_exam(_user_id uuid, _exam_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.exams e
    JOIN public.teacher_assignments ta ON ta.class_id = e.class_id
    JOIN public.teachers t ON t.id = ta.teacher_id
    WHERE t.user_id = _user_id
      AND e.id = _exam_id
      AND (e.section_id IS NULL OR ta.section_id IS NULL OR ta.section_id = e.section_id)
      AND (
        ta.subject_id IS NULL
        OR ta.subject_id = e.subject_id
        OR EXISTS (
          SELECT 1 FROM public.teacher_subjects ts
          WHERE ts.teacher_id = t.id AND ts.subject_id = e.subject_id
        )
      )
  );
$$;

DROP POLICY IF EXISTS "staff and teachers manage marks" ON public.exam_marks;
CREATE POLICY "staff and teachers manage marks"
ON public.exam_marks FOR ALL TO authenticated
USING (
  public.is_school_staff(auth.uid(), school_id)
  OR public.is_super_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'teacher'::app_role)
    AND public.get_user_school(auth.uid()) = school_id
    AND public.teacher_can_manage_exam(auth.uid(), exam_id)
  )
)
WITH CHECK (
  public.is_school_staff(auth.uid(), school_id)
  OR public.is_super_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'teacher'::app_role)
    AND public.get_user_school(auth.uid()) = school_id
    AND public.teacher_can_manage_exam(auth.uid(), exam_id)
  )
);

-- 2. Fees: restrict school-wide reads
DROP POLICY IF EXISTS "School users view invoices" ON public.fee_invoices;
CREATE POLICY "Students and staff view invoices"
ON public.fee_invoices FOR SELECT TO authenticated
USING (
  public.is_school_staff(auth.uid(), school_id)
  OR public.is_super_admin(auth.uid())
  OR student_id = public.get_student_id(auth.uid())
  OR public.is_parent_of_student(auth.uid(), student_id)
);

DROP POLICY IF EXISTS "School users view invoice items" ON public.fee_invoice_items;
CREATE POLICY "Students and staff view invoice items"
ON public.fee_invoice_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fee_invoices i
    WHERE i.id = fee_invoice_items.invoice_id
      AND (
        public.is_school_staff(auth.uid(), i.school_id)
        OR public.is_super_admin(auth.uid())
        OR i.student_id = public.get_student_id(auth.uid())
        OR public.is_parent_of_student(auth.uid(), i.student_id)
      )
  )
);

DROP POLICY IF EXISTS "School users view payments" ON public.fee_payments;
CREATE POLICY "Students and staff view payments"
ON public.fee_payments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fee_invoices i
    WHERE i.id = fee_payments.invoice_id
      AND (
        public.is_school_staff(auth.uid(), i.school_id)
        OR public.is_super_admin(auth.uid())
        OR i.student_id = public.get_student_id(auth.uid())
        OR public.is_parent_of_student(auth.uid(), i.student_id)
      )
  )
);

-- 3. profiles: users cannot change their own tenant assignment or reactivate themselves
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND school_id IS NOT DISTINCT FROM public.get_user_school(auth.uid())
  AND is_active IS TRUE
);

-- 4. Lock down execute privileges on SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.adjust_book_availability() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_invoice_totals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_parent_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_student_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_teacher_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_school(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_parent_of_student(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_school_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_school_staff(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teacher_teaches_class(uuid, uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teacher_teaches_student(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teacher_can_manage_exam(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_parent_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_school(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_staff(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_teaches_class(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_teaches_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_can_manage_exam(uuid, uuid) TO authenticated;
GRANT ALL ON FUNCTION public.teacher_can_manage_exam(uuid, uuid) TO service_role;