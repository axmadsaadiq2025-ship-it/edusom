import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { ArrowLeft, ChevronDown, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAcademicYears, useClasses, useSections } from "@/hooks/use-school-lookups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, ReviewList, WizardActions, WizardCard, WizardSteps } from "@/components/forms/wizard";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { nextSequentialCode } from "@/lib/codes";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/students/new")({
  validateSearch: z.object({ id: z.string().uuid().optional() }),
  head: () => ({ meta: [{ title: "Register student | EduSom" }] }),
  component: NewStudentPage,
});

const STEPS = ["Basic information", "Enrollment", "Contact & guardian"];

const empty = {
  admission_number: "",
  first_name: "",
  last_name: "",
  middle_name: "",
  gender: "",
  date_of_birth: "",
  email: "",
  phone: "",
  address: "",
  nationality: "Somali",
  class_id: "",
  section_id: "",
  academic_year_id: "",
  admission_date: new Date().toISOString().slice(0, 10),
  guardian_name: "",
  guardian_phone: "",
  guardian_email: "",
  guardian_relation: "",
  notes: "",
  status: "active",
};
type Form = typeof empty;
type Errors = Partial<Record<keyof Form, string>>;

const emailOk = (v: string) => !v || z.string().email().safeParse(v).success;
const phoneOk = (v: string) => /^[+\d][\d\s-]{5,19}$/.test(v.trim());

function validate(step: number, f: Form): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!f.first_name.trim()) e.first_name = "First name is required";
    else if (f.first_name.length > 60) e.first_name = "Keep it under 60 characters";
    if (!f.last_name.trim()) e.last_name = "Last name is required";
    else if (f.last_name.length > 60) e.last_name = "Keep it under 60 characters";
    if (!f.gender) e.gender = "Select a gender";
    if (f.date_of_birth && f.date_of_birth > new Date().toISOString().slice(0, 10))
      e.date_of_birth = "Date of birth can't be in the future";
  }
  if (step === 1) {
    if (!f.academic_year_id) e.academic_year_id = "Select an academic year";
    if (!f.class_id) e.class_id = "Select a class";
  }
  if (step === 2) {
    if (!f.guardian_name.trim()) e.guardian_name = "Guardian name is required";
    if (!f.guardian_phone.trim()) e.guardian_phone = "Guardian phone is required";
    else if (!phoneOk(f.guardian_phone)) e.guardian_phone = "Enter a valid phone number";
    if (f.phone && !phoneOk(f.phone)) e.phone = "Enter a valid phone number";
    if (!emailOk(f.email)) e.email = "Enter a valid email";
    if (!emailOk(f.guardian_email)) e.guardian_email = "Enter a valid email";
  }
  return e;
}

function NewStudentPage() {
  const { id: editId } = Route.useSearch();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(empty);
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

  const classesQ = useClasses();
  const sectionsQ = useSections();
  const yearsQ = useAcademicYears();

  const existingQ = useQuery({
    queryKey: ["students", "detail", editId],
    enabled: !!editId,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("id", editId!).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const s = existingQ.data;
    if (!s) return;
    const next = { ...empty };
    for (const k of Object.keys(empty) as (keyof Form)[]) {
      const v = (s as Record<string, unknown>)[k];
      if (v !== null && v !== undefined) next[k] = String(v);
    }
    setForm(next);
  }, [existingQ.data]);

  // Default to the current academic year for new registrations.
  useEffect(() => {
    if (editId || form.academic_year_id || !yearsQ.data?.length) return;
    const cur = yearsQ.data.find((y) => y.is_current) ?? yearsQ.data[0];
    setForm((f) => ({ ...f, academic_year_id: cur.id }));
  }, [yearsQ.data, editId, form.academic_year_id]);

  const sectionOptions = useMemo(
    () =>
      (sectionsQ.data ?? [])
        .filter((s) => s.class_id === form.class_id)
        .map((s) => ({ value: s.id, label: s.name })),
    [sectionsQ.data, form.class_id],
  );
  const classOptions = useMemo(
    () => (classesQ.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [classesQ.data],
  );
  const yearOptions = useMemo(
    () =>
      (yearsQ.data ?? []).map((y) => ({ value: y.id, label: `${y.name}${y.is_current ? " (current)" : ""}` })),
    [yearsQ.data],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        middle_name: form.middle_name.trim() || null,
        gender: (form.gender || null) as "male" | "female" | "other" | null,
        date_of_birth: form.date_of_birth || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        nationality: form.nationality.trim() || null,
        class_id: form.class_id || null,
        section_id: form.section_id || null,
        academic_year_id: form.academic_year_id || null,
        admission_date: form.admission_date,
        guardian_name: form.guardian_name.trim() || null,
        guardian_phone: form.guardian_phone.trim() || null,
        guardian_email: form.guardian_email.trim() || null,
        guardian_relation: form.guardian_relation.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status as "active" | "inactive" | "graduated" | "transferred" | "suspended",
      };
      if (editId) {
        const { error } = await supabase.from("students").update(payload).eq("id", editId);
        if (error) throw error;
        return form.admission_number;
      }
      // Auto-generate admission number; retry if another admin took the same one.
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data: codes, error: cErr } = await supabase
          .from("students")
          .select("admission_number")
          .eq("school_id", profile.school_id)
          .like("admission_number", "STU-%");
        if (cErr) throw cErr;
        const admission_number = nextSequentialCode("STU", (codes ?? []).map((c) => c.admission_number));
        const { error } = await supabase
          .from("students")
          .insert({ ...payload, school_id: profile.school_id, admission_number });
        if (!error) return admission_number;
        if (error.code !== "23505") throw error;
      }
      throw new Error("Could not assign a unique admission number. Please try again.");
    },
    onSuccess: (code) => {
      toast.success(editId ? "Student updated" : `Student registered · Admission no. ${code}`);
      qc.invalidateQueries({ queryKey: ["students"] });
      navigate({ to: "/students" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save student"),
    onSettled: () => {
      submitting.current = false;
    },
  });

  function next() {
    if (step < 3) {
      const e = validate(step, form);
      setErrors(e);
      if (Object.keys(e).length) {
        toast.error("Please fix the highlighted fields");
        return;
      }
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (submitting.current) return; // guard against double taps
    submitting.current = true;
    save.mutate();
  }

  const className = classesQ.data?.find((c) => c.id === form.class_id)?.name;
  const sectionName = sectionsQ.data?.find((s) => s.id === form.section_id)?.name;
  const yearName = yearsQ.data?.find((y) => y.id === form.academic_year_id)?.name;

  if (editId && existingQ.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }
  if (editId && existingQ.isError) {
    return (
      <div className="glass mx-auto max-w-md rounded-2xl p-8 text-center">
        <p className="font-semibold">Couldn't load this student</p>
        <Button className="mt-4" onClick={() => existingQ.refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/students">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to students
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {editId ? "Edit student" : "Register student"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step < 3 ? `Step ${step + 1} of 3 · ${STEPS[step]}` : "Review and confirm"}
            </p>
          </div>
        </div>
      </div>

      <WizardSteps steps={STEPS} current={step} />

      {step === 0 && (
        <WizardCard title="Basic information" description="Who is the student?">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First name" required htmlFor="first_name" error={errors.first_name}>
              <Input id="first_name" autoFocus value={form.first_name} maxLength={60} aria-invalid={!!errors.first_name} onChange={(e) => set({ first_name: e.target.value })} />
            </FormField>
            <FormField label="Last name" required htmlFor="last_name" error={errors.last_name}>
              <Input id="last_name" value={form.last_name} maxLength={60} aria-invalid={!!errors.last_name} onChange={(e) => set({ last_name: e.target.value })} />
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
            <FormField label="Middle name" htmlFor="middle_name">
              <Input id="middle_name" value={form.middle_name} maxLength={60} onChange={(e) => set({ middle_name: e.target.value })} />
            </FormField>
            <FormField label="Date of birth" htmlFor="dob" error={errors.date_of_birth}>
              <Input id="dob" type="date" value={form.date_of_birth} onChange={(e) => set({ date_of_birth: e.target.value })} />
            </FormField>
            <FormField label="Nationality" htmlFor="nationality">
              <Input id="nationality" value={form.nationality} maxLength={60} onChange={(e) => set({ nationality: e.target.value })} />
            </FormField>
          </div>
        </WizardCard>
      )}

      {step === 1 && (
        <WizardCard title="Enrollment" description="Where will the student study?">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Academic year" required htmlFor="year" error={errors.academic_year_id} hint={!yearsQ.isLoading && yearOptions.length === 0 ? "No academic years yet — add one under Academic Years first." : undefined}>
              <SearchableSelect id="year" options={yearOptions} value={form.academic_year_id} invalid={!!errors.academic_year_id} placeholder={yearsQ.isLoading ? "Loading…" : "Select year"} onChange={(v) => set({ academic_year_id: v })} />
            </FormField>
            <FormField label="Class" required htmlFor="class" error={errors.class_id} hint={!classesQ.isLoading && classOptions.length === 0 ? "No classes yet — add one under Classes first." : undefined}>
              <SearchableSelect id="class" options={classOptions} value={form.class_id} invalid={!!errors.class_id} placeholder={classesQ.isLoading ? "Loading…" : "Select class"} onChange={(v) => set({ class_id: v, section_id: "" })} />
            </FormField>
            <FormField label="Section" htmlFor="section" hint={form.class_id && sectionOptions.length === 0 ? "This class has no sections." : undefined}>
              <SearchableSelect id="section" options={sectionOptions} value={form.section_id} disabled={!form.class_id} placeholder={form.class_id ? "Select section" : "Choose a class first"} onChange={(v) => set({ section_id: v })} />
            </FormField>
            <FormField label="Admission number" htmlFor="adm" hideOptional hint={editId ? undefined : "Assigned automatically when you save (e.g. STU-0001)."}>
              <Input id="adm" value={editId ? form.admission_number : "Auto-generated"} readOnly disabled className="font-mono" />
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
              <FormField label="Admission date" htmlFor="adm_date">
                <Input id="adm_date" type="date" value={form.admission_date} onChange={(e) => set({ admission_date: e.target.value })} />
              </FormField>
              {editId && (
                <FormField label="Status" htmlFor="status">
                  <Select value={form.status} onValueChange={(v) => set({ status: v })}>
                    <SelectTrigger id="status" className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["active", "inactive", "graduated", "transferred", "suspended"].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            </CollapsibleContent>
          </Collapsible>
        </WizardCard>
      )}

      {step === 2 && (
        <WizardCard title="Contact & guardian" description="Who should the school contact?">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Guardian name" required htmlFor="g_name" error={errors.guardian_name}>
              <Input id="g_name" value={form.guardian_name} maxLength={100} aria-invalid={!!errors.guardian_name} onChange={(e) => set({ guardian_name: e.target.value })} />
            </FormField>
            <FormField label="Guardian phone" required htmlFor="g_phone" error={errors.guardian_phone}>
              <Input id="g_phone" type="tel" inputMode="tel" value={form.guardian_phone} maxLength={20} placeholder="+252 61 234 5678" aria-invalid={!!errors.guardian_phone} onChange={(e) => set({ guardian_phone: e.target.value })} />
            </FormField>
            <FormField label="Relationship" htmlFor="g_rel">
              <Select value={form.guardian_relation} onValueChange={(v) => set({ guardian_relation: v })}>
                <SelectTrigger id="g_rel" className="h-10"><SelectValue placeholder="Father, Mother…" /></SelectTrigger>
                <SelectContent>
                  {["Father", "Mother", "Guardian", "Uncle", "Aunt", "Grandparent", "Sibling", "Other"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Guardian email" htmlFor="g_email" error={errors.guardian_email}>
              <Input id="g_email" type="email" inputMode="email" value={form.guardian_email} maxLength={255} onChange={(e) => set({ guardian_email: e.target.value })} />
            </FormField>
            <FormField label="Student phone" htmlFor="phone" error={errors.phone}>
              <Input id="phone" type="tel" inputMode="tel" value={form.phone} maxLength={20} onChange={(e) => set({ phone: e.target.value })} />
            </FormField>
            <FormField label="Student email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" inputMode="email" value={form.email} maxLength={255} onChange={(e) => set({ email: e.target.value })} />
            </FormField>
            <FormField label="Address" htmlFor="address" className="sm:col-span-2">
              <Textarea id="address" rows={2} value={form.address} maxLength={300} onChange={(e) => set({ address: e.target.value })} />
            </FormField>
            <FormField label="Additional notes" htmlFor="notes" className="sm:col-span-2">
              <Textarea id="notes" rows={2} value={form.notes} maxLength={1000} onChange={(e) => set({ notes: e.target.value })} />
            </FormField>
          </div>
        </WizardCard>
      )}

      {step === 3 && (
        <WizardCard title="Review" description="Check the details before saving. Use Back to make changes.">
          <ReviewList
            items={[
              ["Full name", [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ")],
              ["Gender", form.gender],
              ["Date of birth", form.date_of_birth],
              ["Nationality", form.nationality],
              ["Academic year", yearName],
              ["Class", [className, sectionName].filter(Boolean).join(" · ")],
              ["Admission number", editId ? form.admission_number : "Assigned on save"],
              ["Admission date", form.admission_date],
              ["Guardian", [form.guardian_name, form.guardian_relation].filter(Boolean).join(" · ")],
              ["Guardian phone", form.guardian_phone],
              ["Student phone", form.phone],
              ["Student email", form.email],
            ]}
          />
        </WizardCard>
      )}

      <WizardActions
        step={step}
        total={4}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={next}
        onCancel={() => navigate({ to: "/students" })}
        submitting={save.isPending}
        submitLabel={editId ? "Save changes" : "Register student"}
      />
    </div>
  );
}
