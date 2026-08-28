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

export const matchDetailsSchema = z.object({
  match_gender_preference: z.string().min(1, "Select your matchmaking preference"),
  age_range: z.string().min(1, "Select your age range"),
  zodiac_sign: z.string().optional(),
  personality_type: z.string().optional(),
  music_taste: z.array(z.string()).default([]),
  movie_interests: z.array(z.string()).default([]),
});

export const onboardingSchema = z.object({
  basicInfo: basicInfoSchema,
  academicDetails: academicDetailsSchema,
  interests: z.array(z.string()).min(3, "Select at least 3 interests"),
  organizations: z.array(z.string()),
  matchDetails: matchDetailsSchema,
  bio: z.string().max(250, "Bio must be at most 250 characters").optional(),
  avatar: z.string().min(1, "Select an avatar"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

