import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, CalendarCheck, Clock, ShieldAlert, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { ACCESS_COPY } from "@/lib/access-shared";

const TITLE = "Account Access — EduSom Cloud";
const DESCRIPTION =
  "EduSom Cloud is invitation-only. Sign-in worked, but this account is not authorized for a school workspace yet.";

const searchSchema = z.object({
  reason: z.enum(["unregistered", "pending", "suspended"]).default("unregistered").catch("unregistered"),
});

export const Route = createFileRoute("/access-pending")({
  ssr: false,
  validateSearch: searchSchema,
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

const ICONS = {
  unregistered: UserX,
  pending: Clock,
  suspended: ShieldAlert,
} as const;

function AccessPendingPage() {
  const { reason } = Route.useSearch();
  const copy = ACCESS_COPY[reason];
  const Icon = ICONS[reason];

  return (
    <div className="bg-gradient-mesh relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-subtle" />

      <div className="glass shadow-elegant w-full max-w-lg rounded-3xl p-8 text-center sm:p-10">
        <div className="mb-8 flex justify-center">
          <BrandLogo size="md" />
        </div>

        <span className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{copy.description}</p>

        <div className="mt-7 space-y-3 text-left">
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {reason === "suspended"
                ? "Your school administrator or the EduSom team can restore access to your account."
                : "Access to EduSom is granted by your school administrator or the EduSom team after review."}
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4">
            <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              New to EduSom? Book a demo and our team will guide your school through onboarding.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/auth">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
            </Link>
          </Button>
          <Button asChild className="bg-gradient-primary rounded-xl text-primary-foreground">
            <Link to="/book-demo">
              <CalendarCheck className="mr-1 h-4 w-4" /> Book a Demo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
