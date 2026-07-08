CREATE TYPE public.invoice_status AS ENUM ('pending','partial','paid','overdue','cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash','bank_transfer','mobile_money','card','cheque','other');

-- Fee categories
CREATE TABLE public.fee_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_categories TO authenticated;
GRANT ALL ON public.fee_categories TO service_role;
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage fee categories" ON public.fee_categories FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "School staff manage fee categories" ON public.fee_categories FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id)) WITH CHECK (public.is_school_staff(auth.uid(), school_id));
CREATE POLICY "School users view fee categories" ON public.fee_categories FOR SELECT TO authenticated
  USING (public.get_user_school(auth.uid()) = school_id);
CREATE TRIGGER update_fee_categories_updated_at BEFORE UPDATE ON public.fee_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoices
CREATE TABLE public.fee_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, invoice_number)
);
CREATE INDEX idx_fee_invoices_student ON public.fee_invoices(student_id);
CREATE INDEX idx_fee_invoices_school_status ON public.fee_invoices(school_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_invoices TO authenticated;
GRANT ALL ON public.fee_invoices TO service_role;
ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage invoices" ON public.fee_invoices FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "School staff manage invoices" ON public.fee_invoices FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id)) WITH CHECK (public.is_school_staff(auth.uid(), school_id));
CREATE POLICY "School users view invoices" ON public.fee_invoices FOR SELECT TO authenticated
  USING (public.get_user_school(auth.uid()) = school_id);
CREATE POLICY "Parents view their children invoices" ON public.fee_invoices FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_parents sp
    JOIN public.parents p ON p.id = sp.parent_id
    WHERE sp.student_id = fee_invoices.student_id AND p.user_id = auth.uid()
  ));
CREATE TRIGGER update_fee_invoices_updated_at BEFORE UPDATE ON public.fee_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoice items
CREATE TABLE public.fee_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
  fee_category_id UUID REFERENCES public.fee_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fee_invoice_items_invoice ON public.fee_invoice_items(invoice_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_invoice_items TO authenticated;
GRANT ALL ON public.fee_invoice_items TO service_role;
ALTER TABLE public.fee_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage invoice items" ON public.fee_invoice_items FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "School staff manage invoice items" ON public.fee_invoice_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fee_invoices i WHERE i.id = invoice_id AND public.is_school_staff(auth.uid(), i.school_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.fee_invoices i WHERE i.id = invoice_id AND public.is_school_staff(auth.uid(), i.school_id)));
CREATE POLICY "School users view invoice items" ON public.fee_invoice_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fee_invoices i WHERE i.id = invoice_id AND public.get_user_school(auth.uid()) = i.school_id));
CREATE POLICY "Parents view children invoice items" ON public.fee_invoice_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.fee_invoices i
    JOIN public.student_parents sp ON sp.student_id = i.student_id
    JOIN public.parents p ON p.id = sp.parent_id
    WHERE i.id = invoice_id AND p.user_id = auth.uid()
  ));

-- Payments
CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  method public.payment_method NOT NULL DEFAULT 'cash',
  reference TEXT,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fee_payments_invoice ON public.fee_payments(invoice_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_payments TO authenticated;
GRANT ALL ON public.fee_payments TO service_role;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage payments" ON public.fee_payments FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "School staff manage payments" ON public.fee_payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fee_invoices i WHERE i.id = invoice_id AND public.is_school_staff(auth.uid(), i.school_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.fee_invoices i WHERE i.id = invoice_id AND public.is_school_staff(auth.uid(), i.school_id)));
CREATE POLICY "School users view payments" ON public.fee_payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fee_invoices i WHERE i.id = invoice_id AND public.get_user_school(auth.uid()) = i.school_id));
CREATE POLICY "Parents view children payments" ON public.fee_payments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.fee_invoices i
    JOIN public.student_parents sp ON sp.student_id = i.student_id
    JOIN public.parents p ON p.id = sp.parent_id
    WHERE i.id = invoice_id AND p.user_id = auth.uid()
  ));
CREATE TRIGGER update_fee_payments_updated_at BEFORE UPDATE ON public.fee_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update invoice totals when payments change
CREATE OR REPLACE FUNCTION public.recalc_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv_id UUID;
  paid NUMERIC(12,2);
  total NUMERIC(12,2);
  due DATE;
BEGIN
  inv_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(SUM(amount),0) INTO paid FROM public.fee_payments WHERE invoice_id = inv_id;
  SELECT total_amount, due_date INTO total, due FROM public.fee_invoices WHERE id = inv_id;
  UPDATE public.fee_invoices
  SET amount_paid = paid,
      status = CASE
        WHEN paid >= total AND total > 0 THEN 'paid'::invoice_status
        WHEN paid > 0 AND paid < total THEN 'partial'::invoice_status
        WHEN due < CURRENT_DATE AND paid < total THEN 'overdue'::invoice_status
        ELSE 'pending'::invoice_status
      END
  WHERE id = inv_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_recalc_invoice_after_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.fee_payments
  FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_totals();
