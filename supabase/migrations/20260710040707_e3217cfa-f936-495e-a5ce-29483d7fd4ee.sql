
-- Enum for loan status
CREATE TYPE public.loan_status AS ENUM ('issued', 'returned', 'overdue', 'lost');

-- BOOKS
CREATE TABLE public.library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  category TEXT,
  publisher TEXT,
  publication_year INT,
  language TEXT DEFAULT 'English',
  shelf_location TEXT,
  total_copies INT NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INT NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
  cover_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_library_books_school ON public.library_books(school_id);
CREATE INDEX idx_library_books_title ON public.library_books(school_id, title);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_books TO authenticated;
GRANT ALL ON public.library_books TO service_role;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_books select same school"
  ON public.library_books FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "library_books staff manage"
  ON public.library_books FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_school_staff(auth.uid(), school_id)
    OR public.has_role(auth.uid(), 'librarian')
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.is_school_staff(auth.uid(), school_id)
    OR public.has_role(auth.uid(), 'librarian')
  );

-- LOANS
CREATE TABLE public.library_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date DATE NOT NULL,
  returned_at TIMESTAMPTZ,
  status public.loan_status NOT NULL DEFAULT 'issued',
  fine_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  issued_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_library_loans_school ON public.library_loans(school_id);
CREATE INDEX idx_library_loans_book ON public.library_loans(book_id);
CREATE INDEX idx_library_loans_student ON public.library_loans(student_id);
CREATE INDEX idx_library_loans_status ON public.library_loans(school_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_loans TO authenticated;
GRANT ALL ON public.library_loans TO service_role;
ALTER TABLE public.library_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_loans select same school"
  ON public.library_loans FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "library_loans staff manage"
  ON public.library_loans FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_school_staff(auth.uid(), school_id)
    OR public.has_role(auth.uid(), 'librarian')
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.is_school_staff(auth.uid(), school_id)
    OR public.has_role(auth.uid(), 'librarian')
  );

-- updated_at triggers
CREATE TRIGGER update_library_books_updated_at
  BEFORE UPDATE ON public.library_books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_library_loans_updated_at
  BEFORE UPDATE ON public.library_loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adjust available_copies on loan changes
CREATE OR REPLACE FUNCTION public.adjust_book_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'issued' THEN
      UPDATE public.library_books
        SET available_copies = GREATEST(available_copies - 1, 0)
        WHERE id = NEW.book_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'issued' AND NEW.status IN ('returned') THEN
      UPDATE public.library_books
        SET available_copies = LEAST(available_copies + 1, total_copies)
        WHERE id = NEW.book_id;
    ELSIF OLD.status IN ('returned') AND NEW.status = 'issued' THEN
      UPDATE public.library_books
        SET available_copies = GREATEST(available_copies - 1, 0)
        WHERE id = NEW.book_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'issued' THEN
      UPDATE public.library_books
        SET available_copies = LEAST(available_copies + 1, total_copies)
        WHERE id = OLD.book_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_library_loans_availability
  AFTER INSERT OR UPDATE OR DELETE ON public.library_loans
  FOR EACH ROW EXECUTE FUNCTION public.adjust_book_availability();
