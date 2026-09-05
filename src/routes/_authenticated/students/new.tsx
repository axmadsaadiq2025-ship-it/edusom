import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, GraduationCap, Loader2, ChevronDown } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/students/new")({
  component: NewStudentPage,
});

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  const first = parts.shift() ?? "";
  const last = parts.pop() ?? "";
  return { first_name: first, middle_name: parts.join(" ") || null, last_name: last || first };
}

function autoAdmissionNumber() {
  return `STU-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function NewStudentPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    mother_name: "",
    mother_phone: "",
    father_name: "",
    father_phone: "",
    payer_name: "",
    payer_phone: "",
    class_id: "",
    academic_year_id: "",
    // advanced
    admission_number: "",
    gender: "",
    date_of_birth: "",
    address: "",
    previous_school: "",
    medical_notes: "",
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const classesQ = useQuery({
    queryKey: ["classes"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const yearsQ = useQuery({
    queryKey: ["academic-years"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id,name,is_current")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const currentYearId =
    form.academic_year_id || (yearsQ.data ?? []).find((y) => y.is_current)?.id || "";

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const name = splitName(form.full_name);

      // Duplicate detection — same name in the same school
      const { data: dupes } = await supabase
        .from("students")
        .select("id")
        .eq("first_name", name.first_name)
        .eq("last_name", name.last_name)
        .limit(1);
      if ((dupes ?? []).length > 0) {
        throw new Error(`A student named ${form.full_name.trim()} already exists.`);
      }

      const notes = [
        form.previous_school && `Previous school: ${form.previous_school.trim()}`,
        form.medical_notes && `Medical: ${form.medical_notes.trim()}`,
        form.father_name && `Father: ${form.father_name.trim()} ${form.father_phone.trim()}`.trim(),
        form.payer_name && `Fee payer: ${form.payer_name.trim()} ${form.payer_phone.trim()}`.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      const { data: student, error } = await supabase
        .from("students")
        .insert({
          school_id: profile.school_id,
          admission_number: form.admission_number.trim() || autoAdmissionNumber(),
          first_name: name.first_name,
          middle_name: name.middle_name,
          last_name: name.last_name,
          phone: form.phone.trim() || null,
          gender: (form.gender || null) as "male" | "female" | "other" | null,
          date_of_birth: form.date_of_birth || null,
          address: form.address.trim() || null,
          nationality: "Somali",
          class_id: form.class_id || null,
          academic_year_id: currentYearId || null,
          admission_date: new Date().toISOString().slice(0, 10),
          guardian_name: form.mother_name.trim() || null,
          guardian_phone: form.mother_phone.trim() || form.father_phone.trim() || null,
          guardian_relation: form.mother_name.trim() ? "Mother" : null,
          notes: notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Create guardian records + links for any named parent
      const guardians = [
        { full: form.mother_name, phone: form.mother_phone, relationship: "mother" },
        { full: form.father_name, phone: form.father_phone, relationship: "father" },
        { full: form.payer_name, phone: form.payer_phone, relationship: "fee payer" },
      ].filter((g) => g.full.trim().length > 0);

      for (const [i, g] of guardians.entries()) {
        const gn = splitName(g.full);
        const { data: parentRow } = await supabase
          .from("parents")
          .insert({
            school_id: profile.school_id,
            first_name: gn.first_name,
            last_name: gn.last_name,
            phone: g.phone.trim() || "—",
          })
          .select("id")
          .single();
        if (parentRow && student) {
          await supabase.from("student_parents").insert({
            parent_id: parentRow.id,
            student_id: student.id,
            relationship: g.relationship,
            is_primary: i === 0,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Student successfully registered.");
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["parents"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      navigate({ to: "/students" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to register student"),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.full_name.trim().length < 3) {
      toast.error("Please enter the student's full name");
      return;
    }
    if (!form.mother_name.trim()) {
      toast.error("Mother's full name is required");
      return;
    }
    if (!form.class_id) {
      toast.error("Please choose a class");
      return;
    }
    create.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/students">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to students
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-gradient-primary shadow-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Add student
            </h1>
            <p className="text-sm text-muted-foreground">
              Only four details are required — the rest can wait.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="glass space-y-4 rounded-2xl p-4 shadow-sm sm:p-6">
          <Field label="Student full name" required>
            <Input
              required
              autoFocus
              value={form.full_name}
              onChange={(e) => set({ full_name: e.target.value })}
              placeholder="e.g. Amina Yusuf Ali"
              className="mt-1.5 h-12 text-base"
            />
          </Field>

          <Field label="Mother's full name" required>
            <Input
              required
              value={form.mother_name}
              onChange={(e) => set({ mother_name: e.target.value })}
              className="mt-1.5 h-12 text-base"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mother's phone">
              <Input
                type="tel"
                inputMode="tel"
                value={form.mother_phone}
                onChange={(e) => set({ mother_phone: e.target.value })}
                placeholder="+252 61 234 5678"
                className="mt-1.5 h-12 text-base"
              />
            </Field>
            <Field label="Student phone">
              <Input
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
                className="mt-1.5 h-12 text-base"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class" required>
              <Select value={form.class_id} onValueChange={(v) => set({ class_id: v })}>
                <SelectTrigger className="mt-1.5 h-12">
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
            <Field label="Academic year">
              <Select value={currentYearId} onValueChange={(v) => set({ academic_year_id: v })}>
                <SelectTrigger className="mt-1.5 h-12">
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
          </div>
        </div>

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="glass flex w-full items-center justify-between rounded-2xl p-4 text-left shadow-sm"
            >
              <span className="text-sm font-semibold text-foreground">
                Additional information (optional)
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  advancedOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="glass mt-2 space-y-4 rounded-2xl p-4 shadow-sm sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Father's full name">
                <Input
                  value={form.father_name}
                  onChange={(e) => set({ father_name: e.target.value })}
                  className="mt-1.5 h-12 text-base"
                />
              </Field>
              <Field label="Father's phone">
                <Input
                  type="tel"
                  value={form.father_phone}
                  onChange={(e) => set({ father_phone: e.target.value })}
                  className="mt-1.5 h-12 text-base"
                />
              </Field>
              <Field label="Fee payer name">
                <Input
                  value={form.payer_name}
                  onChange={(e) => set({ payer_name: e.target.value })}
                  className="mt-1.5 h-12 text-base"
                />
              </Field>
              <Field label="Fee payer phone">
                <Input
                  type="tel"
                  value={form.payer_phone}
                  onChange={(e) => set({ payer_phone: e.target.value })}
                  className="mt-1.5 h-12 text-base"
                />
              </Field>
              <Field label="Student ID / admission number">
                <Input
                  value={form.admission_number}
                  onChange={(e) => set({ admission_number: e.target.value })}
                  placeholder="Generated automatically if empty"
                  className="mt-1.5 h-12 font-mono"
                />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onValueChange={(v) => set({ gender: v })}>
                  <SelectTrigger className="mt-1.5 h-12">
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
                  onChange={(e) => set({ date_of_birth: e.target.value })}
                  className="mt-1.5 h-12"
                />
              </Field>
              <Field label="Previous school">
                <Input
                  value={form.previous_school}
                  onChange={(e) => set({ previous_school: e.target.value })}
                  className="mt-1.5 h-12 text-base"
                />
              </Field>
            </div>
            <Field label="Address">
              <Textarea
                value={form.address}
                onChange={(e) => set({ address: e.target.value })}
                rows={2}
                className="mt-1.5"
              />
            </Field>
            <Field label="Medical information">
              <Textarea
                value={form.medical_notes}
                onChange={(e) => set({ medical_notes: e.target.value })}
                rows={2}
                className="mt-1.5"
              />
            </Field>
          </CollapsibleContent>
        </Collapsible>

        <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
          <Button asChild type="button" variant="ghost">
            <Link to="/students">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-gradient-primary shadow-glow h-11 flex-1 sm:flex-none"
          >
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save student
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
