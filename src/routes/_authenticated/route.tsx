import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import type { Profile } from "@/hooks/use-auth";
import { isSuperAdmin, type AppRole } from "@/lib/roles";
import { clearIdentityCache, getCachedIdentity, setCachedIdentity } from "@/lib/identity-cache";
import { getSchoolTrial } from "@/lib/trial.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingMs: 0,
  pendingMinMs: 250,
  beforeLoad: async ({ location }) => {
    // Fast local session read; full server verification only when the cached
    // identity is missing or stale. RLS still enforces every data request.
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUserId = sessionData.session?.user.id;
    let identity = sessionUserId ? getCachedIdentity(sessionUserId) : null;

    if (!identity) {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        clearIdentityCache();
        throw redirect({
          to: "/auth",
          search: { redirect: location.href },
        });
      }

      const [{ data: profile, error: profileError }, { data: roleRows, error: rolesError }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", data.user.id),
        ]);

      if (profileError || rolesError) {
        throw new Error("Unable to load your account permissions. Please try again.");
      }

      identity = {
        user: data.user,
        profile: (profile as Profile | null) ?? null,
        roles: ((roleRows ?? []) as { role: AppRole }[]).map(({ role }) => role),
      };
      setCachedIdentity(identity);
    }

    const { roles } = identity;
    const data = { user: identity.user };
    const profile = identity.profile;
    const isSuper = isSuperAdmin(roles, data.user.email);

    if (location.pathname === "/dashboard" && isSuper) {
      throw redirect({ to: "/platform/dashboard", replace: true });
    }

    if (location.pathname.startsWith("/platform") && !isSuper) {
      throw redirect({ to: "/dashboard", replace: true });
    }

    // Subscription status is never cached with identity: expiration must apply immediately.
    const trial = !isSuper && profile?.school_id ? await getSchoolTrial() : null;
    if (trial && !trial.allowed && location.pathname !== "/subscription" && location.pathname !== "/settings" && location.pathname !== "/settings/") {
      throw redirect({ to: "/subscription", replace: true });
    }

    return {
      user: data.user,
      profile: (profile as Profile | null) ?? null,
      roles,
      isSuper,
      trial,
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
