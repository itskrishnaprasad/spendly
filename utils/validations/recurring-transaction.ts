import { z } from "zod"

import {
  accountIdSchema,
  categoryIdSchema,
  transactionTypeSchema,
} from "@/utils/validations/category"

export const recurringTransactionIdSchema = z
  .string()
  .uuid("Invalid recurring transaction id.")

export const recurringFrequencySchema = z.enum([
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const)

const dateSchema = z.string().date("Invalid date.")

export const createRecurringTransactionSchema = z
  .object({
    account_id: accountIdSchema,
    category_id: categoryIdSchema,
    type: transactionTypeSchema,
    amount: z.number().positive("Amount must be greater than zero."),
    title: z.string().trim().min(1, "Title is required."),
    note: z.string().trim().min(1).optional().nullable(),
    frequency: recurringFrequencySchema,
    interval_count: z
      .number()
      .int("Interval count must be a whole number.")
      .min(1, "Interval count must be at least 1.")
      .optional(),
    start_date: dateSchema,
    end_date: dateSchema.optional().nullable(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (payload) => {
      if (!payload.end_date) {
        return true
      }

      return payload.end_date >= payload.start_date
    },
    {
      message: "End date must be on or after start date.",
      path: ["end_date"],
    }
  )

export const updateRecurringTransactionSchema = z
  .object({
    account_id: accountIdSchema.optional(),
    category_id: categoryIdSchema.optional(),
    type: transactionTypeSchema.optional(),
    amount: z.number().positive("Amount must be greater than zero.").optional(),
    title: z.string().trim().min(1, "Title cannot be empty.").optional(),
    note: z.string().trim().min(1).optional().nullable(),
    frequency: recurringFrequencySchema.optional(),
    interval_count: z
      .number()
      .int("Interval count must be a whole number.")
      .min(1, "Interval count must be at least 1.")
      .optional(),
    start_date: dateSchema.optional(),
    end_date: dateSchema.optional().nullable(),
    is_active: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required for update.",
  })
  .refine(
    (payload) => {
      if (
        !payload.start_date ||
        payload.end_date === undefined ||
        payload.end_date === null
      ) {
        return true
      }

      return payload.end_date >= payload.start_date
    },
    {
      message: "End date must be on or after start date.",
      path: ["end_date"],
    }
  )

export const recurringTransactionQuerySchema = z.object({
  is_active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  frequency: recurringFrequencySchema.optional(),
  type: transactionTypeSchema.optional(),
})

export type CreateRecurringTransactionInput = z.infer<
  typeof createRecurringTransactionSchema
>
export type UpdateRecurringTransactionInput = z.infer<
  typeof updateRecurringTransactionSchema
>
export type RecurringTransactionQueryInput = z.infer<
  typeof recurringTransactionQuerySchema
>
