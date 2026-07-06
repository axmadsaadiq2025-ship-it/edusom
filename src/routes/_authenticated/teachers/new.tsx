import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, UserSquare2, Loader2 } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/teachers/new")({
  component: NewTeacherPage,
});

function NewTeacherPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    employee_code: "",
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    address: "",
    qualification: "",
    specialization: "",
    years_of_experience: "0",
    joining_date: new Date().toISOString().slice(0, 10),
    salary: "",
    status: "active",
    notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const payload = {
        school_id: profile.school_id,
        employee_code: form.employee_code.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        address: form.address.trim() || null,
        qualification: form.qualification.trim() || null,
        specialization: form.specialization.trim() || null,
        years_of_experience: Number(form.years_of_experience) || 0,
        joining_date: form.joining_date || null,
        salary: form.salary ? Number(form.salary) : null,
        status: form.status as "active" | "on_leave" | "suspended" | "terminated" | "resigned",
        notes: form.notes.trim() || null,
      };
      const { error } = await supabase.from("teachers").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Teacher added");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      navigate({ to: "/teachers" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add teacher"),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employee_code || !form.full_name) {
      toast.error("Employee code and full name are required");
      return;
    }
    create.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/teachers">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to teachers
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary shadow-glow flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground">
            <UserSquare2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Add teacher</h1>
            <p className="text-sm text-muted-foreground">
              Create a new teacher record with employment details.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Section title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employee code *">
              <Input
                required
                value={form.employee_code}
                onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                placeholder="EMP-0001"
                className="mt-1.5 font-mono"
              />
            </Field>
            <Field label="Full name *">
              <Input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
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

        <Section title="Employment">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Qualification">
              <Input
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                placeholder="B.Ed, M.Sc, etc."
                className="mt-1.5"
              />
            </Field>
            <Field label="Specialization">
              <Input
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="Mathematics, Physics, etc."
                className="mt-1.5"
              />
            </Field>
            <Field label="Years of experience">
              <Input
                type="number"
                min={0}
                value={form.years_of_experience}
                onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Joining date">
              <Input
                type="date"
                value={form.joining_date}
                onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Salary">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="0.00"
                className="mt-1.5"
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1.5">
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
        </Section>

        <Section title="Notes">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Any additional information about this teacher…"
          />
        </Section>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button asChild type="button" variant="ghost">
            <Link to="/teachers">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-gradient-primary shadow-glow"
          >
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Add teacher
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
