import { z } from "zod";

export const demoRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  schoolName: z.string().trim().min(2, "Enter your school name").max(160),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(40),
  country: z.string().trim().min(2, "Enter your country").max(100),
  cityRegion: z.string().trim().min(1, "Enter your city or region").max(120),
  schoolType: z.enum(["primary", "secondary", "university", "institute", "training_center"]),
  studentCount: z.coerce.number().int().min(1, "Enter a number of students").max(1000000),
  preferredDate: z.string().trim().min(1, "Choose a preferred demo date").max(32),
  message: z.string().trim().max(1500).optional().or(z.literal("")),
});

export type DemoRequestInput = z.input<typeof demoRequestSchema>;
