import { z } from "zod";
import type { AppRole } from "./roles";

export const SCHOOL_TYPES = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "university", label: "University" },
  { value: "institute", label: "Institute" },
  { value: "training_center", label: "Training Center" },
] as const;

export const ADMIN_POSITIONS = [
  { value: "principal", label: "Principal" },
  { value: "school_owner", label: "School Owner" },
  { value: "director", label: "Director" },
  { value: "administrator", label: "Administrator" },
] as const;

export const PLANS = [
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
] as const;

export const registrationRequestSchema = z
  .object({
    schoolName: z.string().trim().min(2).max(160),
    schoolType: z.enum(["primary", "secondary", "university", "institute", "training_center"]),
    schoolEmail: z.string().trim().email().max(255),
    schoolPhone: z.string().trim().min(6).max(40),
    website: z.string().trim().max(255).optional().or(z.literal("")),

    country: z.string().trim().min(2).max(100),
    stateRegion: z.string().trim().min(1).max(100),
    city: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    streetAddress: z.string().trim().min(3).max(240),
    postalCode: z.string().trim().max(30).optional().or(z.literal("")),

    adminFullName: z.string().trim().min(2).max(120),
    adminEmail: z.string().trim().email().max(255),
    adminPhone: z.string().trim().min(6).max(40),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
    adminPosition: z.enum(["principal", "school_owner", "director", "administrator"]),

    estimatedStudents: z.coerce.number().int().min(1).max(1000000),
    estimatedTeachers: z.coerce.number().int().min(1).max(100000),
    preferredPlan: z.enum(["starter", "professional", "enterprise"]),
    acceptTerms: z.literal(true),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegistrationRequestInput = z.input<typeof registrationRequestSchema>;

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function makeSchoolCode(name: string) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  return `EDU-${initials}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function positionToRole(position: string): AppRole {
  switch (position) {
    case "principal":
      return "principal";
    case "director":
    case "administrator":
    case "school_owner":
    default:
      return "school_owner";
  }
}

export const SCHOOL_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SCHOOL_TYPES.map((t) => [t.value, t.label]),
);
export const POSITION_LABELS: Record<string, string> = Object.fromEntries(
  ADMIN_POSITIONS.map((t) => [t.value, t.label]),
);
export const PLAN_LABELS: Record<string, string> = Object.fromEntries(
  PLANS.map((t) => [t.value, t.label]),
);
