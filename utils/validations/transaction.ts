import { z } from "zod"

import {
  accountIdSchema,
  categoryIdSchema,
  transactionTypeSchema,
} from "@/utils/validations/category"

export const transactionIdSchema = z.string().uuid("Invalid transaction id.")

export const createTransactionSchema = z.object({
  account_id: accountIdSchema,
  category_id: categoryIdSchema,
  type: transactionTypeSchema,
  amount: z.number().finite(),
  title: z.string().trim().min(1, "Title is required."),
  note: z.string().trim().min(1).optional().nullable(),
  transaction_date: z.string().date("Invalid transaction date."),
  is_recurring: z.boolean().optional(),
  recurring_transaction_id: z
    .string()
    .uuid("Invalid recurring transaction id.")
    .optional()
    .nullable(),
})

export const updateTransactionSchema = z
  .object({
    account_id: accountIdSchema.optional(),
    category_id: categoryIdSchema.optional(),
    type: transactionTypeSchema.optional(),
    amount: z.number().finite().optional(),
    title: z.string().trim().min(1, "Title cannot be empty.").optional(),
    note: z.string().trim().min(1).optional().nullable(),
    transaction_date: z.string().date("Invalid transaction date.").optional(),
    is_recurring: z.boolean().optional(),
    recurring_transaction_id: z
      .string()
      .uuid("Invalid recurring transaction id.")
      .optional()
      .nullable(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required for update.",
  })

export const transactionQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
  category_id: categoryIdSchema.optional(),
  account_id: accountIdSchema.optional(),
  from: z.string().date("Invalid from date.").optional(),
  to: z.string().date("Invalid to date.").optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>
