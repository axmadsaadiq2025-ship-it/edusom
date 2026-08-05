import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/platform/")({
  head: () => ({
    meta: [
      { title: "Platform Console · EduSom" },
      { name: "description", content: "EduSom SaaS platform administration console." },
      { property: "og:title", content: "Platform Console · EduSom" },
      { property: "og:description", content: "EduSom SaaS platform administration console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/platform/dashboard", replace: true });
  },
});