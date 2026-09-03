import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AccessResult } from "./access-shared";
import type { AppRole } from "./roles";

/**
 * Server-side authoritative authorization check.
 *
 * Authentication (Google / email+password) only proves identity. This decides whether
 * the identity maps to a registered, approved and active EduSom user. It never creates
 * profiles, roles, schools or invitations.
 */
export const resolveAccessState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccessResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const email = String((context.claims as { email?: string }).email ?? "")
      .trim()
      .toLowerCase();

    const [{ data: profile }, { data: roleRows }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, school_id, is_active")
        .eq("id", userId)
        .maybeSingle(),
      supabaseAdmin.from("user_roles").select("role, school_id").eq("user_id", userId),
    ]);

    const roles = ((roleRows ?? []) as { role: AppRole; school_id: string | null }[]).map(
      (r) => r.role,
    );
    const roleSchoolId =
      ((roleRows ?? []) as { school_id: string | null }[]).find((r) => r.school_id)?.school_id ??
      null;
    const schoolId = profile?.school_id ?? roleSchoolId;

    let isSuper = roles.includes("super_admin");
    if (!isSuper && email) {
      const { data: seed } = await supabaseAdmin
        .from("super_admin_seeds")
        .select("email")
        .eq("email", email)
        .maybeSingle();
      isSuper = Boolean(seed);
    }

    const base = { roles, schoolId, isSuper };

    // Super Admins always land on the platform console.
    if (isSuper) {
      if (profile && profile.is_active === false) {
        return { ...base, state: "suspended", redirectTo: null };
      }
      return { ...base, state: "active", redirectTo: "/platform/dashboard" };
    }

    if (roles.length > 0) {
      if (!profile || profile.is_active === false) {
        return { ...base, state: "suspended", redirectTo: null };
      }
      // School users must belong to a school workspace.
      if (!schoolId) {
        return { ...base, state: "pending", redirectTo: null };
      }
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("id, is_active")
        .eq("id", schoolId)
        .maybeSingle();
      if (!school || school.is_active === false) {
        return { ...base, state: "suspended", redirectTo: null };
      }
      return { ...base, state: "active", redirectTo: "/dashboard" };
    }

    // No role yet: registered-but-waiting vs completely unknown.
    if (email) {
      const { data: requests } = await supabaseAdmin
        .from("school_registration_requests")
        .select("status")
        .or(`admin_email.eq.${email},school_email.eq.${email}`);

      if (requests?.some((r) => r.status === "pending")) {
        return { ...base, state: "pending", redirectTo: null };
      }
      if (requests?.some((r) => r.status === "rejected")) {
        return { ...base, state: "suspended", redirectTo: null };
      }

      const { data: invites } = await supabaseAdmin
        .from("invitations")
        .select("accepted_at, expires_at")
        .eq("email", email);
      if (
        invites?.some((i) => !i.accepted_at && new Date(i.expires_at).getTime() > Date.now())
      ) {
        return { ...base, state: "pending", redirectTo: null };
      }
    }

    if (profile && profile.is_active === false) {
      return { ...base, state: "suspended", redirectTo: null };
    }

    return { ...base, state: "unregistered", redirectTo: null };
  });
