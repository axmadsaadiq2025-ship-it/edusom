import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrandLogo } from "@/components/brand-logo";
import { SCHOOL_TYPES } from "@/lib/registration-shared";
import { trialRegistrationSchema, type TrialRegistrationInput } from "@/lib/trial-shared";
import { registerSchoolTrial } from "@/lib/trial.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Start Your 7-Day Free Trial | EduSom" }, { name: "description", content: "Register your school for instant access to a free seven-day EduSom trial. No payment or approval required." }, { property: "og:title", content: "Start Your 7-Day Free Trial | EduSom" }, { property: "og:description", content: "Start managing your school with instant seven-day trial access." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: RegistrationPage,
});
const initial: TrialRegistrationInput = { schoolName: "", schoolType: "primary", schoolEmail: "", schoolPhone: "", country: "Somalia", city: "", website: "", address: "", adminFullName: "", adminEmail: "", adminPhone: "", password: "", confirmPassword: "" };
function RegistrationPage() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const register = useServerFn(registerSchoolTrial);
  const navigate = useNavigate();
  const router = useRouter();
  const change = (name: keyof TrialRegistrationInput, value: string) => setForm(v => ({ ...v, [name]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const result = trialRegistrationSchema.safeParse(form);
    if (!result.success) { setErrors(Object.fromEntries(result.error.issues.map(i => [String(i.path[0]), i.message]))); return; }
    setErrors({}); setError(""); setBusy(true);
    try {
      if (!created) {
        const response = await register({ data: result.data });
        if (!response.ok) { setError(response.error); return; }
        setCreated(true);
      }
      const login = await supabase.auth.signInWithPassword({ email: result.data.adminEmail, password: result.data.password });
      if (login.error) { setError("Your school is ready. Please log in using the administrator email and password you chose."); return; }
      await router.invalidate();
      await navigate({ to: "/dashboard", replace: true });
    } catch { setError("We couldn’t complete this step. Please try again, or log in if your account was already created."); }
    finally { setBusy(false); }
  }
  function field(name: keyof TrialRegistrationInput, label: string, type = "text", optional = false) {
    return <div key={name} className="min-w-0"><Label htmlFor={name}>{label} <span className="text-xs text-muted-foreground">{optional ? "(optional)" : "*"}</span></Label><Input id={name} name={name} type={type} value={form[name]} onChange={e => change(name, e.target.value)} required={!optional} maxLength={type === "password" ? 72 : 255} autoComplete={type === "password" ? "new-password" : type === "email" ? "email" : type === "tel" ? "tel" : "off"} className="mt-1.5 min-h-11" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} />{errors[name] && <p id={`${name}-error`} className="mt-1 text-xs text-destructive">{errors[name]}</p>}</div>;
  }
  return <main className="min-h-screen bg-background px-4 py-6 sm:py-10"><div className="mx-auto max-w-3xl"><div className="flex items-center justify-between"><BrandLogo /><Button asChild variant="ghost"><Link to="/"><ArrowLeft className="h-4 w-4" />Back</Link></Button></div><h1 className="mt-8 font-dashboard-display text-3xl font-bold">Start Your 7-Day Free Trial</h1><p className="mt-3 text-muted-foreground">Experience EduSom Cloud for free. Register your school and get instant access to your own school management dashboard. No approval required.</p><ul className="my-6 grid gap-2 text-sm sm:grid-cols-2">{["Free access for 7 days.", "No payment required to start.", "Instant account activation.", "No Super Admin approval required.", "Explore the school management modules."].map(text => <li key={text} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{text}</li>)}</ul><form onSubmit={submit} className="space-y-7" noValidate><fieldset disabled={busy || created} className="space-y-4 border-t border-border pt-5"><legend className="font-semibold">School information</legend><div className="grid gap-4 sm:grid-cols-2">{field("schoolName", "School name")}<div><Label htmlFor="schoolType">School type *</Label><Select value={form.schoolType} onValueChange={v => change("schoolType", v)}><SelectTrigger id="schoolType" className="mt-1.5 min-h-11"><SelectValue /></SelectTrigger><SelectContent>{SCHOOL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>{field("schoolEmail", "School email", "email")}{field("schoolPhone", "School phone", "tel")}{field("country", "Country")}{field("city", "City")}{field("website", "School website", "url", true)}{field("address", "School address", "text", true)}</div></fieldset><fieldset disabled={busy || created} className="space-y-4 border-t border-border pt-5"><legend className="font-semibold">Administrator information</legend><div className="grid gap-4 sm:grid-cols-2">{field("adminFullName", "Full name")}{field("adminEmail", "Email address", "email")}{field("adminPhone", "Phone number", "tel")}{field("password", "Password", "password")}{field("confirmPassword", "Confirm password", "password")}</div><p className="text-xs text-muted-foreground">Password must contain at least 8 characters.</p></fieldset>{error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}<Button type="submit" disabled={busy} size="lg" className="w-full sm:w-auto">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{created ? "Open my dashboard" : "Start my 7-day free trial"}</Button><p className="text-sm text-muted-foreground">Already have an account? <Link to="/auth" className="font-medium text-primary">Login</Link></p></form></div></main>;
}