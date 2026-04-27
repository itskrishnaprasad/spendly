import { z } from "zod"

const dateSchema = z.string().date("Invalid date format. Expected YYYY-MM-DD.")

const nullableUuid = z.string().uuid("Invalid identifier.").nullable()

export const budgetIdSchema = z.string().uuid("Invalid budget id.")

export const budgetPeriodSchema = z.enum([
  "weekly",
  "monthly",
  "yearly",
] as const)

export const createBudgetSchema = z
  .object({
    category_id: nullableUuid.optional(),
    account_id: nullableUuid.optional(),
    name: z.string().trim().min(1, "Name is required."),
    amount: z.number().positive("Amount must be greater than zero."),
    period: budgetPeriodSchema,
    start_date: dateSchema,
    end_date: dateSchema.nullable().optional(),
    alert_percentage: z
      .number()
      .int("Alert percentage must be a whole number.")
      .min(1, "Alert percentage must be between 1 and 100.")
      .max(100, "Alert percentage must be between 1 and 100.")
      .nullable()
      .optional(),
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

export const updateBudgetSchema = z
  .object({
    category_id: nullableUuid.optional(),
    account_id: nullableUuid.optional(),
    name: z.string().trim().min(1, "Name cannot be empty.").optional(),
    amount: z.number().positive("Amount must be greater than zero.").optional(),
    period: budgetPeriodSchema.optional(),
    start_date: dateSchema.optional(),
    end_date: dateSchema.nullable().optional(),
    alert_percentage: z
      .number()
      .int("Alert percentage must be a whole number.")
      .min(1, "Alert percentage must be between 1 and 100.")
      .max(100, "Alert percentage must be between 1 and 100.")
      .nullable()
      .optional(),
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

export const budgetsQuerySchema = z.object({
  is_active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  period: budgetPeriodSchema.optional(),
  category_id: z.string().uuid("Invalid category id.").optional(),
  account_id: z.string().uuid("Invalid account id.").optional(),
})

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type BudgetsQueryInput = z.infer<typeof budgetsQuerySchema>
