import { describe, expect, it } from "vitest";
import { trialDaysRemaining, trialRegistrationSchema } from "./trial-shared";
const valid = { schoolName: "Test School", schoolType: "primary", schoolEmail: "school@example.com", schoolPhone: "+252611234567", country: "Somalia", city: "Mogadishu", website: "", address: "", adminFullName: "Test Admin", adminEmail: "admin@example.com", adminPhone: "+252611234568", password: "Secure-test-123", confirmPassword: "Secure-test-123" };
describe("school trial rules", () => {
  it("counts exactly seven days and expires at the boundary", () => {
    const start = Date.parse("2026-11-10T10:00:00Z");
    const end = "2026-11-17T10:00:00Z";
    expect(trialDaysRemaining(end, start)).toBe(7);
    expect(trialDaysRemaining(end, start + 4 * 86400000)).toBe(3);
    expect(trialDaysRemaining(end, start + 6 * 86400000)).toBe(1);
    expect(trialDaysRemaining(end, start + 7 * 86400000)).toBe(0);
  });
  it("requires matching passwords", () => expect(trialRegistrationSchema.safeParse({ ...valid, confirmPassword: "different" }).success).toBe(false));
  it("rejects caller supplied privileged roles", () => expect(trialRegistrationSchema.safeParse({ ...valid, role: "super_admin" }).success).toBe(false));
  it("validates email and phone", () => {
    expect(trialRegistrationSchema.safeParse({ ...valid, adminEmail: "bad" }).success).toBe(false);
    expect(trialRegistrationSchema.safeParse({ ...valid, adminPhone: "abcdefghi" }).success).toBe(false);
    expect(trialRegistrationSchema.safeParse(valid).success).toBe(true);
  });
});