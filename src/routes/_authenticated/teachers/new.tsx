import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, UserSquare2, Loader2, ChevronDown } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/teachers/new")({
  component: NewTeacherPage,
});

function autoEmployeeCode() {
  return `EMP-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function NewTeacherPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    subject_id: "",
    email: "",
    employee_code: "",
    gender: "",
    date_of_birth: "",
    address: "",
    qualification: "",
    specialization: "",
    years_of_experience: "",
    joining_date: new Date().toISOString().slice(0, 10),
    salary: "",
    status: "active",
    notes: "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const subjectsQ = useQuery({
    queryKey: ["subjects"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");

      const { data: dupes } = await supabase
        .from("teachers")
        .select("id")
        .eq("full_name", form.full_name.trim())
        .limit(1);
      if ((dupes ?? []).length > 0) {
        throw new Error(`A teacher named ${form.full_name.trim()} already exists.`);
      }

      const { data: teacher, error } = await supabase
        .from("teachers")
        .insert({
          school_id: profile.school_id,
          employee_code: form.employee_code.trim() || autoEmployeeCode(),
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          gender: form.gender || null,
          date_of_birth: form.date_of_birth || null,
          address: form.address.trim() || null,
          qualification: form.qualification.trim() || null,
          specialization: form.specialization.trim() || null,
          years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : 0,
          joining_date: form.joining_date || null,
          salary: form.salary ? Number(form.salary) : null,
          status: form.status as
            | "active"
            | "on_leave"
            | "suspended"
            | "terminated"
            | "resigned",
          notes: form.notes.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (teacher && form.subject_id) {
        await supabase.from("teacher_subjects").insert({
          school_id: profile.school_id,
          teacher_id: teacher.id,
          subject_id: form.subject_id,
        });
      }
    },
    onSuccess: () => {
      toast.success("Teacher successfully registered.");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      navigate({ to: "/teachers" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add teacher"),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.full_name.trim().length < 3) {
      toast.error("Please enter the teacher's full name");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    create.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/teachers">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to teachers
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-gradient-primary shadow-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground">
            <UserSquare2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Add teacher
            </h1>
            <p className="text-sm text-muted-foreground">
              Name and phone are enough to get started.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="glass space-y-4 rounded-2xl p-4 shadow-sm sm:p-6">
          <Field label="Full name" required>
            <Input
              required
              autoFocus
              value={form.full_name}
              onChange={(e) => set({ full_name: e.target.value })}
              className="mt-1.5 h-12 text-base"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required>
              <Input
                required
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
                placeholder="+252 61 234 5678"
                className="mt-1.5 h-12 text-base"
              />
            </Field>
            <Field label="Main subject">
              <Select value={form.subject_id} onValueChange={(v) => set({ subject_id: v })}>
                <SelectTrigger className="mt-1.5 h-12">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {(subjectsQ.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
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
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  className="mt-1.5 h-12"
                />
              </Field>
              <Field label="Employee code">
                <Input
                  value={form.employee_code}
                  onChange={(e) => set({ employee_code: e.target.value })}
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
              <Field label="Qualification">
                <Input
                  value={form.qualification}
                  onChange={(e) => set({ qualification: e.target.value })}
                  placeholder="B.Ed, M.Sc, etc."
                  className="mt-1.5 h-12"
                />
              </Field>
              <Field label="Specialization">
                <Input
                  value={form.specialization}
                  onChange={(e) => set({ specialization: e.target.value })}
                  className="mt-1.5 h-12"
                />
              </Field>
              <Field label="Years of experience">
                <Input
                  type="number"
                  min={0}
                  value={form.years_of_experience}
                  onChange={(e) => set({ years_of_experience: e.target.value })}
                  className="mt-1.5 h-12"
                />
              </Field>
              <Field label="Joining date">
                <Input
                  type="date"
                  value={form.joining_date}
                  onChange={(e) => set({ joining_date: e.target.value })}
                  className="mt-1.5 h-12"
                />
              </Field>
              <Field label="Salary">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.salary}
                  onChange={(e) => set({ salary: e.target.value })}
                  className="mt-1.5 h-12"
                />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => set({ status: v })}>
                  <SelectTrigger className="mt-1.5 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On leave</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
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
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => set({ notes: e.target.value })}
                rows={2}
                className="mt-1.5"
              />
            </Field>
          </CollapsibleContent>
        </Collapsible>

        <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
          <Button asChild type="button" variant="ghost">
            <Link to="/teachers">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-gradient-primary shadow-glow h-11 flex-1 sm:flex-none"
          >
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save teacher
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
