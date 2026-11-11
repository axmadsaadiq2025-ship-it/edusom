import { z } from "zod";

const phone = z.string().trim().min(7).max(30).regex(/^\+?[0-9 ()-]+$/, "Enter a valid phone number").refine(v => v.replace(/\D/g, "").length >= 7, "Enter at least 7 digits");
export const trialRegistrationSchema = z.object({
  schoolName: z.string().trim().min(2).max(160),
  schoolType: z.enum(["primary", "secondary", "university", "institute", "training_center"]),
  schoolEmail: z.string().trim().email().max(255).transform(v => v.toLowerCase()),
  schoolPhone: phone,
  country: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  website: z.string().trim().max(255).url().refine(v => /^https?:\/\//i.test(v), "Use an https or http website address").or(z.literal("")),
  address: z.string().trim().max(240),
  adminFullName: z.string().trim().min(2).max(120),
  adminEmail: z.string().trim().email().max(255).transform(v => v.toLowerCase()),
  adminPhone: phone,
  password: z.string().min(8).max(72),
  confirmPassword: z.string().min(8).max(72),
}).strict().refine(v => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
export type TrialRegistrationInput = z.input<typeof trialRegistrationSchema>;
export interface SchoolTrial {
  schoolId: string; schoolName: string; status: string; plan: string;
  startedAt: string | null; expiresAt: string | null; daysRemaining: number; allowed: boolean;
}
export function trialDaysRemaining(expiration: string, now: number) {
  return Math.max(0, Math.ceil((Date.parse(expiration) - now) / 86400000));
}