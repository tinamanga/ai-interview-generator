import { z } from "zod";

// Normalize email addresses so differently-cased versions
// cannot accidentally create separate accounts.
const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email must not exceed 254 characters.")
  .email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

// Accept long passphrases without imposing arbitrary complexity rules.
const passwordSchema = z
  .string()
  .min(12, "Password must contain at least 12 characters.")
  .max(128, "Password must not exceed 128 characters.");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(128)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
