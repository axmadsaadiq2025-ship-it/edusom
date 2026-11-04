import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Loader2, Search, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, WizardCard } from "@/components/forms/wizard";
import { splitFullName } from "@/lib/codes";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/parents/new")({
  head: () => ({ meta: [{ title: "Register parent | EduSom" }] }),
  component: NewParentPage,
});

interface LinkedStudent {
  id: string;
  name: string;
  admission_number: string;
}

const RELATIONSHIPS = ["father", "mother", "guardian", "uncle", "aunt", "grandparent", "sibling", "other"];
const phoneOk = (v: string) => /^[+\d][\d\s-]{5,19}$/.test(v.trim());

function NewParentPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const submitting = useRef(false);

  const [form, setForm] = useState({ full_name: "", phone: "", relationship: "", email: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [admission, setAdmission] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [looking, setLooking] = useState(false);
  const [students, setStudents] = useState<LinkedStudent[]>([]);

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(patch)) delete n[k];
      return n;
    });
  };

  async function findStudent() {
    const code = admission.trim();
    setLookupError("");
    if (!code) return setLookupError("Enter an admission number");
    if (!profile?.school_id) return setLookupError("No school assigned to your account");
    if (students.some((s) => s.admission_number.toLowerCase() === code.toLowerCase()))
      return setLookupError("This student is already added");
    setLooking(true);
    // Scoped to the admin's own school; RLS enforces the same.
    const { data, error } = await supabase
      .from("students")
      .select("id,first_name,last_name,admission_number")
      .eq("school_id", profile.school_id)
      .ilike("admission_number", code)
      .maybeSingle();
    setLooking(false);
    if (error) return setLookupError("Couldn't search right now. Try again.");
    if (!data) return setLookupError("No student with that admission number in your school");
    setStudents((s) => [
      ...s,
      { id: data.id, name: `${data.first_name} ${data.last_name}`, admission_number: data.admission_number },
    ]);
    setAdmission("");
    setErrors((e) => ({ ...e, students: "" }));
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const phone = form.phone.trim();
      // Prevent duplicate parent records in this school (same phone).
      const { data: existing } = await supabase
        .from("parents")
        .select("id")
        .eq("school_id", profile.school_id)
        .eq("phone", phone)
        .maybeSingle();

      let parentId = existing?.id;
      if (!parentId) {
        const { first, last } = splitFullName(form.full_name);
        const { data, error } = await supabase
          .from("parents")
          .insert({
            school_id: profile.school_id,
            first_name: first,
            last_name: last,
            phone,
            email: form.email.trim() || null,
            address: form.address.trim() || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        parentId = data.id;
      }

      if (students.length) {
        const { data: already } = await supabase
          .from("student_parents")
          .select("student_id")
          .eq("parent_id", parentId)
          .in("student_id", students.map((s) => s.id));
        const skip = new Set((already ?? []).map((r) => r.student_id));
        const { count } = await supabase
          .from("student_parents")
          .select("id", { count: "exact", head: true })
          .eq("parent_id", parentId);
        const rows = students
          .filter((s) => !skip.has(s.id))
          .map((s, i) => ({
            parent_id: parentId!,
            student_id: s.id,
            relationship: form.relationship,
            is_primary: (count ?? 0) === 0 && i === 0,
          }));
        if (rows.length) {
          const { error } = await supabase.from("student_parents").insert(rows);
          if (error) throw error;
        }
      }
      return !!existing;
    },
    onSuccess: (reused) => {
      toast.success(reused ? "Existing parent found — students linked" : "Parent registered");
      qc.invalidateQueries({ queryKey: ["parents"] });
      navigate({ to: "/parents" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to register parent"),
    onSettled: () => {
      submitting.current = false;
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required";
    else if (form.full_name.trim().length > 100) errs.full_name = "Keep it under 100 characters";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!phoneOk(form.phone)) errs.phone = "Enter a valid phone number";
    if (!form.relationship) errs.relationship = "Select the relationship";
    if (form.email && !z.string().email().safeParse(form.email).success) errs.email = "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length) return toast.error("Please fix the highlighted fields");
    if (submitting.current) return;
    submitting.current = true;
    create.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/parents">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to parents
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Register parent</h1>
            <p className="text-sm text-muted-foreground">Add a parent and link them to their children.</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <WizardCard title="Parent details">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" required htmlFor="full_name" error={errors.full_name}>
              <Input id="full_name" autoFocus value={form.full_name} maxLength={100} aria-invalid={!!errors.full_name} onChange={(e) => set({ full_name: e.target.value })} />
            </FormField>
            <FormField label="Phone number" required htmlFor="phone" error={errors.phone}>
              <Input id="phone" type="tel" inputMode="tel" value={form.phone} maxLength={20} placeholder="+252 61 234 5678" aria-invalid={!!errors.phone} onChange={(e) => set({ phone: e.target.value })} />
            </FormField>
            <FormField label="Relationship to student" required htmlFor="rel" error={errors.relationship}>
              <Select value={form.relationship} onValueChange={(v) => set({ relationship: v })}>
                <SelectTrigger id="rel" className="h-10" aria-invalid={!!errors.relationship}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" inputMode="email" value={form.email} maxLength={255} onChange={(e) => set({ email: e.target.value })} />
            </FormField>
            <FormField label="Address" htmlFor="address" className="sm:col-span-2">
              <Textarea id="address" rows={2} value={form.address} maxLength={300} onChange={(e) => set({ address: e.target.value })} />
            </FormField>
          </div>
        </WizardCard>

        <WizardCard title="Link to student" description="Enter the student's admission number (e.g. STU-0001).">
          <FormField label="Admission number" htmlFor="adm" error={lookupError}>
            <div className="flex gap-2">
              <Input
                id="adm"
                value={admission}
                maxLength={40}
                className="font-mono"
                placeholder="STU-0001"
                onChange={(e) => { setAdmission(e.target.value); setLookupError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); findStudent(); } }}
              />
              <Button type="button" variant="outline" onClick={findStudent} disabled={looking}>
                {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-1.5">Find</span>
              </Button>
            </div>
          </FormField>
          {students.length > 0 && (
            <ul className="space-y-2">
              {students.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{s.admission_number}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {form.relationship && <Badge variant="secondary" className="capitalize">{form.relationship}</Badge>}
                    <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${s.name}`} onClick={() => setStudents((l) => l.filter((x) => x.id !== s.id))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WizardCard>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-border/60 bg-background/90 py-3 backdrop-blur">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/parents" })} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending} className="min-w-32">
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {create.isPending ? "Saving…" : "Register parent"}
          </Button>
        </div>
      </form>
    </div>
  );
}
