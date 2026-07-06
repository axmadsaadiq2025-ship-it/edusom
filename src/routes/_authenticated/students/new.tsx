import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/students/new")({
  component: NewStudentPage,
});

function NewStudentPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
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
  });

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const sectionsQ = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("id,name,class_id");
      if (error) throw error;
      return data ?? [];
    },
  });
  const yearsQ = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id,name,is_current")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filteredSections = useMemo(
    () => (sectionsQ.data ?? []).filter((s) => !form.class_id || s.class_id === form.class_id),
    [sectionsQ.data, form.class_id],
  );

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const payload = {
        school_id: profile.school_id,
        admission_number: form.admission_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        middle_name: form.middle_name.trim() || null,
        gender: form.gender || null,
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
      };
      const { error } = await supabase.from("students").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Student admitted");
      qc.invalidateQueries({ queryKey: ["students"] });
      navigate({ to: "/students" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to admit student"),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.admission_number || !form.first_name || !form.last_name) {
      toast.error("Admission number, first and last name are required");
      return;
    }
    create.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/students">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to students
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary shadow-glow flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Admit student</h1>
            <p className="text-sm text-muted-foreground">
              Create a new student record with enrollment details.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Section title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Admission number *">
              <Input
                required
                value={form.admission_number}
                onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
                placeholder="STU-0001"
                className="mt-1.5 font-mono"
              />
            </Field>
            <Field label="Admission date">
              <Input
                type="date"
                value={form.admission_date}
                onChange={(e) => setForm({ ...form, admission_date: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="First name *">
              <Input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Middle name">
              <Input
                value={form.middle_name}
                onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Last name *">
              <Input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date of birth">
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Nationality">
              <Input
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                className="mt-1.5"
              />
            </Field>
          </div>
        </Section>

        <Section title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+252 61 234 5678"
                className="mt-1.5"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="mt-1.5"
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Enrollment">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Academic year">
              <Select
                value={form.academic_year_id}
                onValueChange={(v) => setForm({ ...form, academic_year_id: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {(yearsQ.data ?? []).map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                      {y.is_current ? " (current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Class">
              <Select
                value={form.class_id}
                onValueChange={(v) => setForm({ ...form, class_id: v, section_id: "" })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {(classesQ.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Section">
              <Select
                value={form.section_id}
                onValueChange={(v) => setForm({ ...form, section_id: v })}
                disabled={!form.class_id}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Guardian">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Guardian name">
              <Input
                value={form.guardian_name}
                onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Relation">
              <Input
                value={form.guardian_relation}
                onChange={(e) => setForm({ ...form, guardian_relation: e.target.value })}
                placeholder="Father, Mother, Guardian…"
                className="mt-1.5"
              />
            </Field>
            <Field label="Guardian phone">
              <Input
                value={form.guardian_phone}
                onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Guardian email">
              <Input
                type="email"
                value={form.guardian_email}
                onChange={(e) => setForm({ ...form, guardian_email: e.target.value })}
                className="mt-1.5"
              />
            </Field>
          </div>
        </Section>

        <Section title="Notes">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Any additional information about this student…"
          />
        </Section>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button asChild type="button" variant="ghost">
            <Link to="/students">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-gradient-primary shadow-glow"
          >
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Admit student
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass space-y-4 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
