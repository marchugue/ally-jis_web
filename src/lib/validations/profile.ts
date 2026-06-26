import { z } from "zod";

export const profileSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  bio: z.string().max(250, "Bio must be at most 250 characters").optional().or(z.literal('')),
  department: z.string().min(1, "Select your department"),
  course: z.string().min(1, "Select your course"),
  yearLevel: z.string().min(1, "Select your year level"),
  interests: z.array(z.string()).min(3, "Select at least 3 interests"),
  organizations: z.array(z.string()),
  avatar: z.string().min(1, "Select an avatar"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
