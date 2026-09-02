import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarCheck, Clock, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

const TITLE = "Access Pending Approval — EduSom Cloud";
const DESCRIPTION =
  "EduSom Cloud is invitation-only. Your email is not approved yet — book a demo or wait for your school administrator to grant access.";

export const Route = createFileRoute("/access-pending")({
  ssr: false,
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
  component: AccessPendingPage,
});

function AccessPendingPage() {
  return (
    <div className="bg-gradient-mesh flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-subtle" />

      <div className="glass shadow-elegant w-full max-w-lg rounded-3xl p-8 text-center sm:p-10">
        <div className="mb-8 flex justify-center">
          <BrandLogo size="md" />
        </div>

        <span className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground">
          <ShieldAlert className="h-7 w-7" />
        </span>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Access pending approval
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          EduSom Cloud is invitation-only. Your sign-in worked, but this email has not been approved
          for a school workspace yet, so you have been signed out for security.
        </p>

        <div className="mt-7 space-y-3 text-left">
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4">
            <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Already requested access? Our team reviews new schools manually. You will receive your
              sign-in details once your school is approved.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4">
            <CalendarCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              New to EduSom? Book a demo and our team will guide your school through onboarding.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-gradient-primary rounded-xl text-primary-foreground">
            <Link to="/book-demo">
              <CalendarCheck className="mr-1 h-4 w-4" /> Book a Demo
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/auth">Try another account</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-xl">
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" /> Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
