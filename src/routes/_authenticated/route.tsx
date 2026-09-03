import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import type { Profile } from "@/hooks/use-auth";
import { resolveAccessState } from "@/lib/access.functions";
import type { AccessResult } from "@/lib/access-shared";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingMs: 0,
  pendingMinMs: 250,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }

    // Authorization is decided server-side; a session alone grants nothing.
    let access: AccessResult;
    try {
      access = await resolveAccessState();
    } catch {
      throw new Error("Unable to load your account permissions. Please try again.");
    }

    if (access.state !== "active") {
      await supabase.auth.signOut();
      throw redirect({ to: "/access-pending", search: { reason: access.state } });
    }

    const { roles, isSuper } = access;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) {
      throw new Error("Unable to load your account permissions. Please try again.");
    }

    if (location.pathname === "/dashboard" && isSuper) {
      throw redirect({ to: "/platform/dashboard", replace: true });
    }

    if (location.pathname.startsWith("/platform") && !isSuper) {
      throw redirect({ to: "/dashboard", replace: true });
    }

    return {
      user: data.user,
      profile: (profile as Profile | null) ?? null,
      roles,
      isSuper,
    };
  },
  component: AuthenticatedLayout,
  pendingComponent: AuthenticationSplash,
});

function AuthenticatedLayout() {
  const { user, profile, roles, isSuper } = Route.useRouteContext();

  return (
    <AppShell identity={{ user, profile, roles, isSuper }}>
      <Outlet />
    </AppShell>
  );
}

function AuthenticationSplash() {
  return (
    <div className="bg-gradient-subtle flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col items-center gap-5" role="status" aria-live="polite">
        <BrandLogo size="lg" />
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
          <div className="bg-gradient-primary h-full w-1/2 animate-pulse rounded-full" />
        </div>
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    </div>
  );
}
