import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { ArrowLeft, ChevronDown, UserSquare2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAcademicYears, useClasses, useSubjects } from "@/hooks/use-school-lookups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, ReviewList, WizardActions, WizardCard, WizardSteps } from "@/components/forms/wizard";
import { MultiSearchableSelect } from "@/components/forms/searchable-select";
import { nextSequentialCode } from "@/lib/codes";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/teachers/new")({
  validateSearch: z.object({ id: z.string().uuid().optional() }),
  head: () => ({ meta: [{ title: "Register teacher | EduSom" }] }),
  component: NewTeacherPage,
});

const STEPS = ["Basic information", "Contact", "Employment"];

const empty = {
  employee_code: "",
  full_name: "",
  gender: "",
  date_of_birth: "",
  avatar_url: "",
  phone: "",
  email: "",
  address: "",
  joining_date: new Date().toISOString().slice(0, 10),
  qualification: "",
  specialization: "",
  years_of_experience: "0",
  salary: "",
  status: "active",
  notes: "",
};
type Form = typeof empty;
type Errors = Partial<Record<keyof Form | "subjects" | "classes", string>>;

const phoneOk = (v: string) => /^[+\d][\d\s-]{5,19}$/.test(v.trim());

function validate(step: number, f: Form, subjects: string[], classes: string[]): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!f.full_name.trim()) e.full_name = "Full name is required";
    else if (f.full_name.length > 100) e.full_name = "Keep it under 100 characters";
    if (!f.gender) e.gender = "Select a gender";
    if (f.avatar_url && !z.string().url().safeParse(f.avatar_url).success) e.avatar_url = "Enter a valid image link";
  }
  if (step === 1) {
    if (!f.phone.trim()) e.phone = "Phone number is required";
    else if (!phoneOk(f.phone)) e.phone = "Enter a valid phone number";
    if (f.email && !z.string().email().safeParse(f.email).success) e.email = "Enter a valid email";
  }
  if (step === 2) {
    if (!f.joining_date) e.joining_date = "Employment date is required";
    if (subjects.length === 0) e.subjects = "Assign at least one subject";
    if (classes.length === 0) e.classes = "Assign at least one class";
    if (f.salary && Number(f.salary) < 0) e.salary = "Salary can't be negative";
  }
  return e;
}

function NewTeacherPage() {
  const { id: editId } = Route.useSearch();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(empty);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [moreOpen, setMoreOpen] = useState(false);
  const submitting = useRef(false);
  const set = (patch: Partial<Form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(patch)) delete n[k as keyof Form];
      return n;
    });
  };

  const subjectsQ = useSubjects();
  const classesQ = useClasses();
  const yearsQ = useAcademicYears();
  const currentYearId = yearsQ.data?.find((y) => y.is_current)?.id ?? yearsQ.data?.[0]?.id ?? null;

  const existingQ = useQuery({
    queryKey: ["teachers", "detail", editId],
    enabled: !!editId,
    queryFn: async () => {
      const [t, ts, ta] = await Promise.all([
        supabase.from("teachers").select("*").eq("id", editId!).single(),
        supabase.from("teacher_subjects").select("subject_id").eq("teacher_id", editId!),
        supabase.from("teacher_assignments").select("class_id").eq("teacher_id", editId!),
      ]);
      if (t.error) throw t.error;
      return {
        teacher: t.data,
        subjects: (ts.data ?? []).map((r) => r.subject_id),
        classes: [...new Set((ta.data ?? []).map((r) => r.class_id))],
      };
    },
  });

  useEffect(() => {
    const d = existingQ.data;
    if (!d) return;
    const next = { ...empty };
    for (const k of Object.keys(empty) as (keyof Form)[]) {
      const v = (d.teacher as Record<string, unknown>)[k];
      if (v !== null && v !== undefined) next[k] = String(v);
    }
    setForm(next);
    setSubjects(d.subjects);
    setClasses(d.classes);
  }, [existingQ.data]);

  const subjectOptions = useMemo(
    () => (subjectsQ.data ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
    [subjectsQ.data],
  );
  const classOptions = useMemo(
    () => (classesQ.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [classesQ.data],
  );

  const save = useMutation({
    mutationFn: async () => {
      const schoolId = profile?.school_id;
      if (!schoolId) throw new Error("No school assigned to your account");
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        avatar_url: form.avatar_url.trim() || null,
        address: form.address.trim() || null,
        qualification: form.qualification.trim() || null,
        specialization: form.specialization.trim() || null,
        years_of_experience: Number(form.years_of_experience) || 0,
        joining_date: form.joining_date || null,
        salary: form.salary ? Number(form.salary) : null,
        status: form.status as "active" | "on_leave" | "suspended" | "terminated" | "resigned",
        notes: form.notes.trim() || null,
      };

      let teacherId = editId;
      let code = form.employee_code;
      if (editId) {
        const { error } = await supabase.from("teachers").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        for (let attempt = 0; attempt < 4 && !teacherId; attempt++) {
          const { data: codes, error: cErr } = await supabase
            .from("teachers")
            .select("employee_code")
            .eq("school_id", schoolId)
            .like("employee_code", "EMP-%");
          if (cErr) throw cErr;
          code = nextSequentialCode("EMP", (codes ?? []).map((c) => c.employee_code));
          const { data, error } = await supabase
            .from("teachers")
            .insert({ ...payload, school_id: schoolId, employee_code: code })
            .select("id")
            .single();
          if (error && error.code !== "23505") throw error;
          if (data) teacherId = data.id;
        }
        if (!teacherId) throw new Error("Could not assign a unique employee code. Please try again.");
      }

      // Sync subjects (only add/remove the differences).
      const prevSubjects = existingQ.data?.subjects ?? [];
      const addS = subjects.filter((s) => !prevSubjects.includes(s));
      const delS = prevSubjects.filter((s) => !subjects.includes(s));
      if (addS.length) {
        const { error } = await supabase
          .from("teacher_subjects")
          .insert(addS.map((subject_id) => ({ teacher_id: teacherId!, subject_id, school_id: schoolId })));
        if (error) throw error;
      }
      if (delS.length) {
        const { error } = await supabase.from("teacher_subjects").delete().eq("teacher_id", teacherId!).in("subject_id", delS);
        if (error) throw error;
      }
      // Sync class assignments (class-level rows; detailed section/subject rows stay untouched).
      const prevClasses = existingQ.data?.classes ?? [];
      const addC = classes.filter((c) => !prevClasses.includes(c));
      if (addC.length) {
        const { error } = await supabase.from("teacher_assignments").insert(
          addC.map((class_id) => ({
            teacher_id: teacherId!,
            class_id,
            school_id: schoolId,
            academic_year_id: currentYearId,
          })),
        );
        if (error) throw error;
      }
      const delC = prevClasses.filter((c) => !classes.includes(c));
      if (delC.length) {
        const { error } = await supabase.from("teacher_assignments").delete().eq("teacher_id", teacherId!).in("class_id", delC);
        if (error) throw error;
      }
      return code;
    },
    onSuccess: (code) => {
      toast.success(editId ? "Teacher updated" : `Teacher registered · Employee code ${code}`);
      qc.invalidateQueries({ queryKey: ["teachers"] });
      navigate({ to: "/teachers" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save teacher"),
    onSettled: () => {
      submitting.current = false;
    },
  });

  function next() {
    if (step < 3) {
      const e = validate(step, form, subjects, classes);
      setErrors(e);
      if (Object.keys(e).length) {
        toast.error("Please fix the highlighted fields");
        return;
      }
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
    save.mutate();
  }

  if (editId && existingQ.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const labelsFor = (ids: string[], opts: { value: string; label: string }[]) =>
    opts.filter((o) => ids.includes(o.value)).map((o) => o.label).join(", ");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/teachers">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to teachers
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <UserSquare2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {editId ? "Edit teacher" : "Register teacher"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step < 3 ? `Step ${step + 1} of 3 · ${STEPS[step]}` : "Review and confirm"}
            </p>
          </div>
        </div>
      </div>

      <WizardSteps steps={STEPS} current={step} />

      {step === 0 && (
        <WizardCard title="Basic information">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" required htmlFor="full_name" error={errors.full_name}>
              <Input id="full_name" autoFocus value={form.full_name} maxLength={100} aria-invalid={!!errors.full_name} onChange={(e) => set({ full_name: e.target.value })} />
            </FormField>
            <FormField label="Gender" required htmlFor="gender" error={errors.gender}>
              <Select value={form.gender} onValueChange={(v) => set({ gender: v })}>
                <SelectTrigger id="gender" className="h-10" aria-invalid={!!errors.gender}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Date of birth" htmlFor="dob">
              <Input id="dob" type="date" value={form.date_of_birth} onChange={(e) => set({ date_of_birth: e.target.value })} />
            </FormField>
            <FormField label="Profile photo link" htmlFor="photo" error={errors.avatar_url} hint="Paste a link to the teacher's photo.">
              <Input id="photo" type="url" value={form.avatar_url} maxLength={500} placeholder="https://…" onChange={(e) => set({ avatar_url: e.target.value })} />
            </FormField>
            <FormField label="Employee code" htmlFor="code" hideOptional hint={editId ? undefined : "Assigned automatically when you save (e.g. EMP-0001)."}>
              <Input id="code" value={editId ? form.employee_code : "Auto-generated"} readOnly disabled className="font-mono" />
            </FormField>
          </div>
        </WizardCard>
      )}

      {step === 1 && (
        <WizardCard title="Contact information">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone number" required htmlFor="phone" error={errors.phone}>
              <Input id="phone" type="tel" inputMode="tel" autoFocus value={form.phone} maxLength={20} placeholder="+252 61 234 5678" aria-invalid={!!errors.phone} onChange={(e) => set({ phone: e.target.value })} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" inputMode="email" value={form.email} maxLength={255} onChange={(e) => set({ email: e.target.value })} />
            </FormField>
            <FormField label="Address" htmlFor="address" className="sm:col-span-2">
              <Textarea id="address" rows={2} value={form.address} maxLength={300} onChange={(e) => set({ address: e.target.value })} />
            </FormField>
          </div>
        </WizardCard>
      )}

      {step === 2 && (
        <WizardCard title="Employment information">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Employment date" required htmlFor="join" error={errors.joining_date}>
              <Input id="join" type="date" value={form.joining_date} onChange={(e) => set({ joining_date: e.target.value })} />
            </FormField>
            <FormField label="Assigned subjects" required htmlFor="subjects" error={errors.subjects} hint={!subjectsQ.isLoading && subjectOptions.length === 0 ? "No subjects yet — add them under Subjects first." : undefined}>
              <MultiSearchableSelect id="subjects" options={subjectOptions} values={subjects} invalid={!!errors.subjects} placeholder={subjectsQ.isLoading ? "Loading…" : "Select subjects"} onChange={(v) => { setSubjects(v); setErrors((e) => ({ ...e, subjects: undefined })); }} />
            </FormField>
            <FormField label="Assigned classes" required htmlFor="classes" error={errors.classes} hint={!classesQ.isLoading && classOptions.length === 0 ? "No classes yet — add them under Classes first." : undefined}>
              <MultiSearchableSelect id="classes" options={classOptions} values={classes} invalid={!!errors.classes} placeholder={classesQ.isLoading ? "Loading…" : "Select classes"} onChange={(v) => { setClasses(v); setErrors((e) => ({ ...e, classes: undefined })); }} />
            </FormField>
            <FormField label="Qualifications" htmlFor="qual">
              <Input id="qual" value={form.qualification} maxLength={150} placeholder="B.Ed, M.Sc…" onChange={(e) => set({ qualification: e.target.value })} />
            </FormField>
          </div>
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="-ml-2 text-primary">
                <ChevronDown className={`mr-1 h-4 w-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                Additional information
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="grid gap-4 pt-3 sm:grid-cols-2">
              <FormField label="Salary" htmlFor="salary" error={errors.salary}>
                <Input id="salary" type="number" inputMode="decimal" min={0} step="0.01" value={form.salary} onChange={(e) => set({ salary: e.target.value })} />
              </FormField>
              <FormField label="Specialization" htmlFor="spec">
                <Input id="spec" value={form.specialization} maxLength={150} onChange={(e) => set({ specialization: e.target.value })} />
              </FormField>
              <FormField label="Years of experience" htmlFor="yoe">
                <Input id="yoe" type="number" inputMode="numeric" min={0} value={form.years_of_experience} onChange={(e) => set({ years_of_experience: e.target.value })} />
              </FormField>
              <FormField label="Status" htmlFor="status">
                <Select value={form.status} onValueChange={(v) => set({ status: v })}>
                  <SelectTrigger id="status" className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On leave</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Additional notes" htmlFor="notes" className="sm:col-span-2">
                <Textarea id="notes" rows={2} value={form.notes} maxLength={1000} onChange={(e) => set({ notes: e.target.value })} />
              </FormField>
            </CollapsibleContent>
          </Collapsible>
        </WizardCard>
      )}

      {step === 3 && (
        <WizardCard title="Review" description="Check the details before saving. Use Back to make changes.">
          <ReviewList
            items={[
              ["Full name", form.full_name],
              ["Gender", form.gender],
              ["Phone", form.phone],
              ["Email", form.email],
              ["Employee code", editId ? form.employee_code : "Assigned on save"],
              ["Employment date", form.joining_date],
              ["Subjects", labelsFor(subjects, subjectOptions)],
              ["Classes", labelsFor(classes, classOptions)],
              ["Qualifications", form.qualification],
              ["Salary", form.salary],
            ]}
          />
        </WizardCard>
      )}

      <WizardActions
        step={step}
        total={4}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={next}
        onCancel={() => navigate({ to: "/teachers" })}
        submitting={save.isPending}
        submitLabel={editId ? "Save changes" : "Register teacher"}
      />
    </div>
  );
}
