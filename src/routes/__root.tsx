import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function NotFoundComponent() {
  return (
    <div className="bg-gradient-mesh flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-10 text-center shadow-elegant">
        <div className="bg-gradient-primary bg-clip-text text-7xl font-bold text-transparent">
          404
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="bg-gradient-primary shadow-glow inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="bg-gradient-mesh flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-10 text-center shadow-elegant">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. You can try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-gradient-primary shadow-glow inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EduSom — School Management System" },
      {
        name: "description",
        content:
          "Modern cloud-based school management system for schools in Somalia. Manage admissions, students, teachers, fees, exams, and more.",
      },
      { name: "author", content: "EduSom" },
      { property: "og:title", content: "EduSom — School Management System" },
      {
        property: "og:description",
        content:
          "Modern cloud-based school management system for schools in Somalia. Manage admissions, students, teachers, fees, exams, and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#7c3aed" },
      { name: "twitter:title", content: "EduSom — School Management System" },
      { name: "twitter:description", content: "Modern cloud-based school management system for schools in Somalia. Manage admissions, students, teachers, fees, exams, and more." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/b65f6795-30b3-4fa7-81eb-b0a7654b2b36" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/b65f6795-30b3-4fa7-81eb-b0a7654b2b36" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED"
      )
        return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <Outlet />
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
