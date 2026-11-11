import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { trialRegistrationSchema, type TrialRegistrationInput, type SchoolTrial } from "./trial-shared";

export const registerSchoolTrial = createServerFn({ method: "POST" })
  .inputValidator((input: TrialRegistrationInput) => trialRegistrationSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = crypto.randomUUID();
    const { password, confirmPassword: _confirmation, ...payload } = data;
    const ip = getRequestHeader("cf-connecting-ip") ?? "unknown";
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const key = "ip:" + Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
    const reserved = await supabaseAdmin.rpc("reserve_school_trial", { _id: id, _payload: payload, _limit_key: key });
    if (reserved.error) return { ok: false as const, error: "A registration already exists for these details. Please log in or use different school details." };
    if (!reserved.data) return { ok: false as const, error: "Too many registration attempts. Please try again in an hour." };
    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.adminEmail, password, email_confirm: true,
      user_metadata: { full_name: data.adminFullName, trial_token: id },
    });
    if (created.error || !created.data.user) {
      await supabaseAdmin.from("trial_registrations").delete().eq("id", id).is("school_id", null);
      return { ok: false as const, error: "Registration could not be completed. If this email already has an account, please log in." };
    }
    // Auth's insert trigger provisions the entire workspace in the same transaction.
    return { ok: true as const };
  });

export const getSchoolTrial = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_school_trial");
    if (error) throw new Error("Unable to check your subscription. Please try again.");
    return data as unknown as SchoolTrial | null;
  });

export const manageSchoolTrial = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ schoolId: z.string().uuid(), action: z.enum(["extend", "activate", "suspend"]), days: z.number().int().min(1).max(365).default(7), plan: z.enum(["starter", "professional", "enterprise"]).default("professional") }).parse(input))
  .handler(async ({ data, context }) => {
    const check = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (check.error || !check.data) throw new Error("Only a platform administrator can change subscriptions.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const school = await supabaseAdmin.from("schools").select("trial_started_at, trial_expires_at, trial_converted_at").eq("id", data.schoolId).single();
    if (school.error) throw new Error("School not found.");
    if (data.action === "extend" && !school.data.trial_started_at) throw new Error("This school does not have a trial.");
    const expires = Math.max(Date.now(), Date.parse(school.data.trial_expires_at ?? "") || 0) + data.days * 86400000;
    const changes = data.action === "extend" ? { subscription_status: "trialing", trial_expires_at: new Date(expires).toISOString(), is_active: true }
      : data.action === "activate" ? { subscription_status: "active", plan: data.plan, is_active: true, trial_converted_at: school.data.trial_started_at ? school.data.trial_converted_at ?? new Date().toISOString() : null }
      : { is_active: false };
    const updated = await supabaseAdmin.from("schools").update(changes).eq("id", data.schoolId);
    if (updated.error) throw new Error("Could not update the subscription.");
    if (data.action === "activate") await supabaseAdmin.from("subscription_upgrade_requests").update({ status: "activated" }).eq("school_id", data.schoolId).eq("status", "pending");
    return { ok: true };
  });