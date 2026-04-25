import { z } from "zod"

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const optionalString = z.string().trim().min(1).optional()

export const transactionTypeSchema = z.enum(["income", "expense"] as const)
export const accountTypeSchema = z.enum([
  "cash",
  "bank",
  "wallet",
  "credit_card",
] as const)

export const categoryIdSchema = z.string().uuid("Invalid category id.")
export const accountIdSchema = z.string().uuid("Invalid account id.")

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  type: transactionTypeSchema,
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(slugRegex, "Slug must be kebab-case.")
    .optional(),
  icon: optionalString,
  color: optionalString,
})

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty.").optional(),
    type: transactionTypeSchema.optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .regex(slugRegex, "Slug must be kebab-case.")
      .optional(),
    icon: optionalString,
    color: optionalString,
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required for update.",
  })

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  type: accountTypeSchema,
  balance: z.number().finite().optional(),
  color: optionalString,
  icon: optionalString,
  is_archived: z.boolean().optional(),
})

export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty.").optional(),
    type: accountTypeSchema.optional(),
    balance: z.number().finite().optional(),
    color: optionalString,
    icon: optionalString,
    is_archived: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required for update.",
  })

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
