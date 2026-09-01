import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, CalendarCheck, CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";

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
import { BrandLogo } from "@/components/brand-logo";
import { LandingFooter } from "@/components/landing/landing-footer";
import { SCHOOL_TYPES } from "@/lib/registration-shared";
import { demoRequestSchema, type DemoRequestInput } from "@/lib/demo-request-shared";
import { submitDemoRequest } from "@/lib/registration.functions";

const TITLE = "Book a Demo — EduSom Cloud School Management System";
const DESCRIPTION =
  "Request a personalised EduSom Cloud demo for your school. Tell us about your school and our team will schedule a guided walkthrough.";

export const Route = createFileRoute("/book-demo")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookDemoPage,
});

const EMPTY: DemoRequestInput = {
  fullName: "",
  schoolName: "",
  email: "",
  phone: "",
  country: "Somalia",
  cityRegion: "",
  schoolType: "primary",
  studentCount: "" as unknown as number,
  preferredDate: "",
  message: "",
};

function BookDemoPage() {
  const [form, setForm] = useState<DemoRequestInput>(EMPTY);
  const [done, setDone] = useState(false);
  const submit = useServerFn(submitDemoRequest);

  const mutation = useMutation({
    mutationFn: (data: DemoRequestInput) => submit({ data }),
    onSuccess: () => {
      setDone(true);
      setForm(EMPTY);
      toast.success("Demo request received. Our team will contact you shortly.");
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit your request."),
  });

  function set<K extends keyof DemoRequestInput>(key: K, value: DemoRequestInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = demoRequestSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    mutation.mutate(form);
  }

  return (
    <div className="bg-gradient-mesh min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-subtle" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/" aria-label="EduSom Cloud home">
          <BrandLogo size="md" />
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-xl">
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
          <Button asChild className="bg-gradient-primary rounded-xl text-primary-foreground">
            <Link to="/auth">Login</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
        <section className="pt-4">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Invitation-only platform
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Book a Demo
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            EduSom Cloud is onboarded school by school. Share a few details and our team will
            schedule a guided walkthrough of admissions, academics, attendance, exams and finance
            — tailored to your school.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              "A 30-minute guided session with a product specialist",
              "See your own workflows mapped to EduSom modules",
              "Pricing, onboarding timeline and data migration plan",
              "No account is created until your school is approved",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <div className="glass mt-10 flex items-start gap-3 rounded-2xl p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your details are used only to prepare and schedule your demo. Access to EduSom Cloud
              is granted by our team after review — accounts are never created automatically.
            </p>
          </div>
        </section>

        <section>
          <div className="glass shadow-elegant rounded-3xl p-6 sm:p-9">
            {done ? (
              <div className="flex flex-col items-center py-12 text-center">
                <span className="bg-gradient-primary shadow-glow flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground">
                  <CalendarCheck className="h-7 w-7" />
                </span>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
                  Request received
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Thank you. Your demo request is now pending review. Our team will contact you to
                  confirm the date and, once your school is approved, we will send your sign-in
                  details.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to="/">Back to home</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => setDone(false)}
                  >
                    Submit another request
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="fullName">
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                      placeholder="Amina Yusuf"
                      className="h-11 rounded-xl"
                      required
                      maxLength={120}
                    />
                  </Field>
                  <Field label="School name" htmlFor="schoolName">
                    <Input
                      id="schoolName"
                      value={form.schoolName}
                      onChange={(e) => set("schoolName", e.target.value)}
                      placeholder="Horizon Academy"
                      className="h-11 rounded-xl"
                      required
                      maxLength={160}
                    />
                  </Field>
                  <Field label="Email" htmlFor="email">
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@school.edu"
                      className="h-11 rounded-xl"
                      required
                      maxLength={255}
                    />
                  </Field>
                  <Field label="Phone number" htmlFor="phone">
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+252 61 000 0000"
                      className="h-11 rounded-xl"
                      required
                      maxLength={40}
                    />
                  </Field>
                  <Field label="Country" htmlFor="country">
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                      placeholder="Somalia"
                      className="h-11 rounded-xl"
                      required
                      maxLength={100}
                    />
                  </Field>
                  <Field label="City / Region" htmlFor="cityRegion">
                    <Input
                      id="cityRegion"
                      value={form.cityRegion}
                      onChange={(e) => set("cityRegion", e.target.value)}
                      placeholder="Mogadishu, Banaadir"
                      className="h-11 rounded-xl"
                      required
                      maxLength={120}
                    />
                  </Field>
                  <Field label="School type" htmlFor="schoolType">
                    <Select
                      value={form.schoolType}
                      onValueChange={(v) => set("schoolType", v as DemoRequestInput["schoolType"])}
                    >
                      <SelectTrigger id="schoolType" className="h-11 rounded-xl">
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
                  <Field label="Number of students" htmlFor="studentCount">
                    <Input
                      id="studentCount"
                      type="number"
                      min={1}
                      value={String(form.studentCount ?? "")}
                      onChange={(e) => set("studentCount", e.target.value as unknown as number)}
                      placeholder="450"
                      className="h-11 rounded-xl"
                      required
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Preferred demo date" htmlFor="preferredDate">
                      <Input
                        id="preferredDate"
                        type="date"
                        value={form.preferredDate}
                        onChange={(e) => set("preferredDate", e.target.value)}
                        className="h-11 rounded-xl"
                        required
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Message" htmlFor="message" optional>
                  <Textarea
                    id="message"
                    value={form.message ?? ""}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="Tell us what you would like to see in the demo…"
                    className="min-h-28 rounded-xl"
                    maxLength={1500}
                  />
                </Field>

                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-gradient-primary shadow-glow h-12 w-full rounded-xl text-base font-medium transition-transform hover:scale-[1.01]"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CalendarCheck className="mr-2 h-4 w-4" /> Book a Demo
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By submitting you agree to be contacted about your demo. No account is created
                  until your school is approved.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm">
        {label}
        {optional ? <span className="ml-1 text-xs text-muted-foreground">(optional)</span> : null}
      </Label>
      {children}
    </div>
  );
}
