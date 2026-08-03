import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  registrationRequestSchema,
  type RegistrationRequestInput,
  slugify,
  makeSchoolCode,
  positionToRole,
} from "./registration-shared";

/** Public: submit a school access request. Creates a blocked auth user (password hashed by auth). */
export const submitRegistrationRequest = createServerFn({ method: "POST" })
  .inputValidator((data: RegistrationRequestInput) => registrationRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const schoolEmail = data.schoolEmail.trim().toLowerCase();
    const adminEmail = data.adminEmail.trim().toLowerCase();

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("school_registration_requests")
      .select("id, school_email, admin_email")
      .or(`school_email.ilike.${schoolEmail},admin_email.ilike.${adminEmail}`);
    if (existingError) throw new Error(existingError.message);
    if (existing && existing.length > 0) {
      const dupSchool = existing.some((r) => r.school_email.toLowerCase() === schoolEmail);
      throw new Error(
        dupSchool
          ? "A request with this school email already exists."
          : "A request with this administrator email already exists.",
      );
    }

    const { data: created, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.adminFullName, phone: data.adminPhone },
    });
    if (userError || !created?.user) {
      throw new Error(
        userError?.message?.includes("already")
          ? "An account with this administrator email already exists."
          : (userError?.message ?? "Could not create the administrator account."),
      );
    }

    // Block sign-in until a Super Admin approves the request.
    await supabaseAdmin.auth.admin.updateUserById(created.user.id, {
      ban_duration: "876000h",
    });

    const { error: insertError } = await supabaseAdmin
      .from("school_registration_requests")
      .insert({
        school_name: data.schoolName.trim(),
        school_type: data.schoolType,
        school_email: schoolEmail,
        school_phone: data.schoolPhone.trim(),
        website: data.website?.trim() || null,
        country: data.country.trim(),
        state_region: data.stateRegion.trim(),
        city: data.city.trim(),
        district: data.district.trim(),
        street_address: data.streetAddress.trim(),
        postal_code: data.postalCode?.trim() || null,
        admin_full_name: data.adminFullName.trim(),
        admin_email: adminEmail,
        admin_phone: data.adminPhone.trim(),
        admin_position: data.adminPosition,
        admin_user_id: created.user.id,
        estimated_students: data.estimatedStudents,
        estimated_teachers: data.estimatedTeachers,
        preferred_plan: data.preferredPlan,
        accepted_terms: data.acceptTerms,
      });
    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(insertError.message);
    }

    return { ok: true as const };
  });

async function assertSuperAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_super_admin", {
    _user_id: context.userId,
  });
  if (error || !data) throw new Error("Forbidden: Super Admin only");
}

export const approveRegistrationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; notes?: string }) => data)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error: reqError } = await supabaseAdmin
      .from("school_registration_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (reqError) throw new Error(reqError.message);
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("This request has already been reviewed.");

    let slug = slugify(req.school_name);
    const { data: slugTaken } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (slugTaken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: school, error: schoolError } = await supabaseAdmin
      .from("schools")
      .insert({
        name: req.school_name,
        slug,
        school_code: makeSchoolCode(req.school_name),
        email: req.school_email,
        phone: req.school_phone,
        website: req.website,
        school_type: req.school_type,
        address: req.street_address,
        country: req.country,
        state_region: req.state_region,
        city: req.city,
        district: req.district,
        postal_code: req.postal_code,
        plan: req.preferred_plan,
        subscription_status: "active",
        is_active: true,
      })
      .select("id, school_code")
      .single();
    if (schoolError || !school) throw new Error(schoolError?.message ?? "Could not create school");

    if (req.admin_user_id) {
      await supabaseAdmin.auth.admin.updateUserById(req.admin_user_id, {
        ban_duration: "none",
      });
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: req.admin_user_id,
          school_id: school.id,
          full_name: req.admin_full_name,
          email: req.admin_email,
          phone: req.admin_phone,
          is_active: true,
        });
      await supabaseAdmin.from("user_roles").insert({
        user_id: req.admin_user_id,
        school_id: school.id,
        role: positionToRole(req.admin_position),
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("school_registration_requests")
      .update({
        status: "approved",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        school_id: school.id,
        notes: data.notes ?? req.notes,
      })
      .eq("id", req.id);
    if (updateError) throw new Error(updateError.message);

    // Placeholders for outbound notifications.
    console.log(`[placeholder email] Welcome to EduSom, ${req.admin_email} (school ${school.school_code})`);
    console.log(`[placeholder sms] ${req.admin_phone}: Your EduSom school account is approved.`);

    return { ok: true as const, schoolId: school.id, schoolCode: school.school_code };
  });

export const rejectRegistrationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; reason: string }) => {
    if (!data.reason?.trim()) throw new Error("A rejection reason is required.");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req } = await supabaseAdmin
      .from("school_registration_requests")
      .select("id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("This request has already been reviewed.");

    const { error } = await supabaseAdmin
      .from("school_registration_requests")
      .update({
        status: "rejected",
        rejection_reason: data.reason.trim(),
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteRegistrationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req } = await supabaseAdmin
      .from("school_registration_requests")
      .select("id, status, admin_user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!req) throw new Error("Request not found");

    const { error } = await supabaseAdmin
      .from("school_registration_requests")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (req.status === "pending" && req.admin_user_id) {
      await supabaseAdmin.auth.admin.deleteUser(req.admin_user_id);
    }
    return { ok: true as const };
  });
