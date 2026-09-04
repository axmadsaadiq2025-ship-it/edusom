import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, ArrowRight, ArrowLeft, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ADMIN_POSITIONS,
  PLANS,
  SCHOOL_TYPES,
  registrationRequestSchema,
  type RegistrationRequestInput,
} from "@/lib/registration-shared";
import { submitRegistrationRequest } from "@/lib/registration.functions";

const STEPS = ["School", "Location", "Administrator", "Details"];

type FormState = {
  schoolName: string;
  schoolType: string;
  schoolEmail: string;
  schoolPhone: string;
  website: string;
  country: string;
  stateRegion: string;
  city: string;
  district: string;
  streetAddress: string;
  postalCode: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
  password: string;
  confirmPassword: string;
  adminPosition: string;
  estimatedStudents: string;
  estimatedTeachers: string;
  preferredPlan: string;
  acceptTerms: boolean;
};

const EMPTY: FormState = {
  schoolName: "",
  schoolType: "",
  schoolEmail: "",
  schoolPhone: "",
  website: "",
  country: "Somalia",
  stateRegion: "",
  city: "",
  district: "",
  streetAddress: "",
  postalCode: "",
  adminFullName: "",
  adminEmail: "",
  adminPhone: "",
  password: "",
  confirmPassword: "",
  adminPosition: "",
  estimatedStudents: "",
  estimatedTeachers: "",
  preferredPlan: "professional",
  acceptTerms: false,
};

const STEP_FIELDS: (keyof FormState)[][] = [
  ["schoolName", "schoolType", "schoolEmail", "schoolPhone"],
  ["country", "stateRegion", "city", "district", "streetAddress"],
  ["adminFullName", "adminEmail", "adminPhone", "password", "confirmPassword", "adminPosition"],
  ["estimatedStudents", "estimatedTeachers", "preferredPlan", "acceptTerms"],
];

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function RequestAccessDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = useServerFn(submitRegistrationRequest);

  const set = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  function validate(fields: (keyof FormState)[]) {
    const result = registrationRequestSchema.safeParse({
      ...form,
      estimatedStudents: form.estimatedStudents || 0,
      estimatedTeachers: form.estimatedTeachers || 0,
    } as unknown as RegistrationRequestInput);
    if (result.success) return true;
    const found: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (fields.includes(key as keyof FormState) && !found[key]) {
        found[key] = issue.message === "Required" ? "This field is required" : issue.message;
      }
    }
    if (Object.keys(found).length === 0) return true;
    setErrors(found);
    return false;
  }

  function next() {
    if (!validate(STEP_FIELDS[step]!)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    if (!validate(STEP_FIELDS.flat())) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      await submit({
        data: {
          ...form,
          estimatedStudents: Number(form.estimatedStudents),
          estimatedTeachers: Number(form.estimatedTeachers),
        } as RegistrationRequestInput,
      });
      setDone(true);
      toast.success("Request submitted — we'll be in touch shortly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setTimeout(() => {
        setStep(0);
        setForm(EMPTY);
        setErrors({});
        setDone(false);
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[92svh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl p-0">
        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center sm:px-10">
            <div className="bg-gradient-primary flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground">
              <PartyPopper className="h-7 w-7" />
            </div>
            <DialogTitle className="text-2xl">Request received</DialogTitle>
            <DialogDescription className="max-w-md">
              Your school access request is now pending review by the EduSom team. Once approved,
              you'll receive a welcome email and can sign in with the administrator email and
              password you chose.
            </DialogDescription>
            <Button className="mt-2 rounded-xl" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-3 border-b border-border/60 px-5 pb-5 pt-6 text-left sm:px-8">
              <DialogTitle className="text-xl sm:text-2xl">Request Access</DialogTitle>
              <DialogDescription>
                Tell us about your school. A Super Admin reviews every request before access is
                granted.
              </DialogDescription>
              <ol className="flex flex-wrap gap-2 pt-1">
                {STEPS.map((s, i) => (
                  <li
                    key={s}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      i === step
                        ? "bg-gradient-primary border-transparent text-primary-foreground"
                        : i < step
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                    {s}
                  </li>
                ))}
              </ol>
            </DialogHeader>

            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-8">
              {step === 0 && (
                <>
                  <Field label="School name *" htmlFor="schoolName" error={errors["schoolName"]}>
                    <Input
                      id="schoolName"
                      value={form.schoolName}
                      onChange={(e) => set({ schoolName: e.target.value })}
                      placeholder="Horizon Academy"
                    />
                  </Field>
                  <Field label="School type *" error={errors["schoolType"]}>
                    <Select
                      value={form.schoolType}
                      onValueChange={(v) => set({ schoolType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="School email *" htmlFor="schoolEmail" error={errors["schoolEmail"]}>
                    <Input
                      id="schoolEmail"
                      type="email"
                      value={form.schoolEmail}
                      onChange={(e) => set({ schoolEmail: e.target.value })}
                      placeholder="info@school.edu"
                    />
                  </Field>
                  <Field label="School phone *" htmlFor="schoolPhone" error={errors["schoolPhone"]}>
                    <Input
                      id="schoolPhone"
                      value={form.schoolPhone}
                      onChange={(e) => set({ schoolPhone: e.target.value })}
                      placeholder="+252 61 000 0000"
                    />
                  </Field>
                  <Field label="Website (optional)" htmlFor="website" error={errors["website"]}>
                    <Input
                      id="website"
                      value={form.website}
                      onChange={(e) => set({ website: e.target.value })}
                      placeholder="https://school.edu"
                    />
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <Field label="Country *" htmlFor="country" error={errors["country"]}>
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(e) => set({ country: e.target.value })}
                    />
                  </Field>
                  <Field label="State / Region *" htmlFor="stateRegion" error={errors["stateRegion"]}>
                    <Input
                      id="stateRegion"
                      value={form.stateRegion}
                      onChange={(e) => set({ stateRegion: e.target.value })}
                    />
                  </Field>
                  <Field label="City *" htmlFor="city" error={errors["city"]}>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => set({ city: e.target.value })}
                    />
                  </Field>
                  <Field label="District *" htmlFor="district" error={errors["district"]}>
                    <Input
                      id="district"
                      value={form.district}
                      onChange={(e) => set({ district: e.target.value })}
                    />
                  </Field>
                  <Field
                    label="Street address *"
                    htmlFor="streetAddress"
                    error={errors["streetAddress"]}
                  >
                    <Input
                      id="streetAddress"
                      value={form.streetAddress}
                      onChange={(e) => set({ streetAddress: e.target.value })}
                    />
                  </Field>
                  <Field label="Postal code (optional)" htmlFor="postalCode" error={errors["postalCode"]}>
                    <Input
                      id="postalCode"
                      value={form.postalCode}
                      onChange={(e) => set({ postalCode: e.target.value })}
                    />
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <Field label="Full name *" htmlFor="adminFullName" error={errors["adminFullName"]}>
                    <Input
                      id="adminFullName"
                      value={form.adminFullName}
                      onChange={(e) => set({ adminFullName: e.target.value })}
                    />
                  </Field>
                  <Field label="Email *" htmlFor="adminEmail" error={errors["adminEmail"]}>
                    <Input
                      id="adminEmail"
                      type="email"
                      autoComplete="email"
                      value={form.adminEmail}
                      onChange={(e) => set({ adminEmail: e.target.value })}
                    />
                  </Field>
                  <Field label="Phone number *" htmlFor="adminPhone" error={errors["adminPhone"]}>
                    <Input
                      id="adminPhone"
                      value={form.adminPhone}
                      onChange={(e) => set({ adminPhone: e.target.value })}
                    />
                  </Field>
                  <Field label="Position *" error={errors["adminPosition"]}>
                    <Select
                      value={form.adminPosition}
                      onValueChange={(v) => set({ adminPosition: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {ADMIN_POSITIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Password *" htmlFor="password" error={errors["password"]}>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => set({ password: e.target.value })}
                      placeholder="At least 8 characters"
                    />
                  </Field>
                  <Field
                    label="Confirm password *"
                    htmlFor="confirmPassword"
                    error={errors["confirmPassword"]}
                  >
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(e) => set({ confirmPassword: e.target.value })}
                    />
                  </Field>
                </>
              )}

              {step === 3 && (
                <>
                  <Field
                    label="Estimated students *"
                    htmlFor="estimatedStudents"
                    error={errors["estimatedStudents"]}
                  >
                    <Input
                      id="estimatedStudents"
                      type="number"
                      min={1}
                      value={form.estimatedStudents}
                      onChange={(e) => set({ estimatedStudents: e.target.value })}
                    />
                  </Field>
                  <Field
                    label="Estimated teachers *"
                    htmlFor="estimatedTeachers"
                    error={errors["estimatedTeachers"]}
                  >
                    <Input
                      id="estimatedTeachers"
                      type="number"
                      min={1}
                      value={form.estimatedTeachers}
                      onChange={(e) => set({ estimatedTeachers: e.target.value })}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Preferred plan *
                    </Label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {PLANS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => set({ preferredPlan: p.value })}
                          className={cn(
                            "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                            form.preferredPlan === p.value
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-border hover:bg-accent",
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-border/70 bg-muted/40 p-4">
                    <Checkbox
                      id="acceptTerms"
                      checked={form.acceptTerms}
                      onCheckedChange={(v) => set({ acceptTerms: v === true })}
                    />
                    <div>
                      <Label htmlFor="acceptTerms" className="text-sm font-medium">
                        I accept the Terms of Service and Privacy Policy
                      </Label>
                      {errors["acceptTerms"] && (
                        <p className="text-xs text-destructive">You must accept the terms</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-4 sm:px-8">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                disabled={step === 0 || submitting}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <span className="text-xs text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </span>
              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={next}
                  className="bg-gradient-primary rounded-xl text-primary-foreground"
                >
                  Continue <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-primary rounded-xl text-primary-foreground"
                >
                  {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
