import { z } from "zod";

export const basicInfoSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  email: z.string().email("Enter a valid CHMSU email").endsWith("@chmsu.edu.ph", "Must be a CHMSU email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const academicDetailsSchema = z.object({
  department: z.string().min(1, "Select your department"),
  course: z.string().min(1, "Select your course"),
  yearLevel: z.string().min(1, "Select your year level"),
});

export const onboardingSchema = z.object({
  basicInfo: basicInfoSchema,
  academicDetails: academicDetailsSchema,
  interests: z.array(z.string()).min(3, "Select at least 3 interests"),
  organizations: z.array(z.string()),
  bio: z.string().max(250, "Bio must be at most 250 characters").optional(),
  avatar: z.string().min(1, "Select an avatar"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
