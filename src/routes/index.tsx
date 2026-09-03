import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolveAccessState } from "@/lib/access.functions";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import {
  Hero,
  TrustedBy,
  WhyEduSom,
  CoreModules,
  Workflow,
  DashboardPreview,
  ParentApp,
  TeacherPortal,
  Pricing,
  Testimonials,
  FAQ,
  FinalCTA,
  BlogAndSupport,
} from "@/components/landing/sections";

const SITE = "https://edusom.lovable.app";
const OG_IMAGE =
  "https://edusom.lovable.app/__l5e/assets-v1/04154a7e-b5c2-451d-85f7-b14b2383942d/edusom-logo.png";
const TITLE = "EduSom Cloud — School Management System for Africa";
const DESCRIPTION =
  "Manage admissions, students, teachers, attendance, exams, finance and school operations from one secure cloud platform. Free 30-day trial.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/` },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "EduSom Cloud",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: DESCRIPTION,
          url: `${SITE}/`,
          image: OG_IMAGE,
          offers: {
            "@type": "Offer",
            price: "49",
            priceCurrency: "USD",
          },
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      // Signed in (including a returning Google OAuth redirect): let the server decide access.
      try {
        const access = await resolveAccessState();
        if (!active) return;
        if (access.state === "active" && access.redirectTo) {
          navigate({ to: access.redirectTo, replace: true });
          return;
        }
        await supabase.auth.signOut();
        if (active) navigate({ to: "/access-pending", search: { reason: access.state }, replace: true });
      } catch {
        await supabase.auth.signOut();
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <Hero />
        <TrustedBy />
        <WhyEduSom />
        <CoreModules />
        <Workflow />
        <DashboardPreview />
        <ParentApp />
        <TeacherPortal />
        <Pricing />
        <Testimonials />
        <BlogAndSupport />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
