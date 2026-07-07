import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Users, Loader2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/parents/new")({
  component: NewParentPage,
});

interface StudentLite {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface ChildLink {
  student_id: string;
  relationship: string;
  is_primary: boolean;
}

function NewParentPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    alt_phone: "",
    occupation: "",
    national_id: "",
    address: "",
    notes: "",
  });

  const [links, setLinks] = useState<Link[]>([]);
  const [studentPick, setStudentPick] = useState("");
  const [relationship, setRelationship] = useState("father");

  const studentsQ = useQuery({
    queryKey: ["students", "for-parents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id,first_name,last_name,admission_number")
        .order("first_name");
      if (error) throw error;
      return (data ?? []) as StudentLite[];
    },
  });

  const availableStudents = (studentsQ.data ?? []).filter(
    (s) => !links.some((l) => l.student_id === s.id),
  );

  function addLink() {
    if (!studentPick) return;
    setLinks([
      ...links,
      { student_id: studentPick, relationship, is_primary: links.length === 0 },
    ]);
    setStudentPick("");
  }

  function removeLink(id: string) {
    setLinks(links.filter((l) => l.student_id !== id));
  }

  function togglePrimary(id: string) {
    setLinks(links.map((l) => ({ ...l, is_primary: l.student_id === id })));
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const { data: parent, error } = await supabase
        .from("parents")
        .insert({
          school_id: profile.school_id,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim(),
          alt_phone: form.alt_phone.trim() || null,
          occupation: form.occupation.trim() || null,
          national_id: form.national_id.trim() || null,
          address: form.address.trim() || null,
          notes: form.notes.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (links.length > 0 && parent) {
        const { error: linkErr } = await supabase.from("student_parents").insert(
          links.map((l) => ({
            parent_id: parent.id,
            student_id: l.student_id,
            relationship: l.relationship,
            is_primary: l.is_primary,
          })),
        );
        if (linkErr) throw linkErr;
      }
    },
    onSuccess: () => {
      toast.success("Parent added");
      qc.invalidateQueries({ queryKey: ["parents"] });
      navigate({ to: "/parents" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add parent"),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.phone) {
      toast.error("First name, last name and phone are required");
      return;
    }
    create.mutate();
  }

  const studentById = new Map((studentsQ.data ?? []).map((s) => [s.id, s]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/parents">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to parents
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary shadow-glow flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Add parent</h1>
            <p className="text-sm text-muted-foreground">
              Create a guardian record and link them to their children.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Section title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name *">
              <Input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
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
            <Field label="Occupation">
              <Input
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="National ID">
              <Input
                value={form.national_id}
                onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                className="mt-1.5"
              />
            </Field>
          </div>
        </Section>

        <Section title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone *">
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+252 61 234 5678"
                className="mt-1.5"
              />
            </Field>
            <Field label="Alternate phone">
              <Input
                value={form.alt_phone}
                onChange={(e) => setForm({ ...form, alt_phone: e.target.value })}
                className="mt-1.5"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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

        <Section title="Linked children">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={studentPick} onValueChange={setStudentPick}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No more students
                  </div>
                ) : (
                  availableStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.admission_number})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="uncle">Uncle</SelectItem>
                <SelectItem value="aunt">Aunt</SelectItem>
                <SelectItem value="grandparent">Grandparent</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={addLink} disabled={!studentPick}>
              Add
            </Button>
          </div>

          {links.length > 0 && (
            <div className="mt-4 space-y-2">
              {links.map((l) => {
                const s = studentById.get(l.student_id);
                return (
                  <div
                    key={l.student_id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        {s ? `${s.first_name} ${s.last_name}` : "Student"}
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {l.relationship}
                      </Badge>
                      {l.is_primary && (
                        <Badge className="bg-primary/15 text-primary">Primary</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!l.is_primary && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePrimary(l.student_id)}
                        >
                          Make primary
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeLink(l.student_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Notes">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Any additional information about this parent…"
          />
        </Section>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button asChild type="button" variant="ghost">
            <Link to="/parents">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-gradient-primary shadow-glow"
          >
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Add parent
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
