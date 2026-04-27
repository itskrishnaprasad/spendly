"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Account, Category } from "@/types/base"
import type { BudgetWithRelations, CreateBudgetInput } from "@/types/budget"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const nullableDate = z
  .string()
  .date("Invalid date format. Expected YYYY-MM-DD.")
  .or(z.literal(""))

const budgetFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    amount: z.coerce.number().positive("Amount must be greater than zero."),
    period: z.enum(["weekly", "monthly", "yearly"] as const),
    category_id: z.string().optional(),
    account_id: z.string().optional(),
    alert_percentage: z
      .union([
        z.literal(""),
        z.coerce
          .number()
          .int("Alert percentage must be a whole number.")
          .min(1, "Alert percentage must be between 1 and 100.")
          .max(100, "Alert percentage must be between 1 and 100."),
      ])
      .optional(),
    start_date: z.string().date("Invalid date format. Expected YYYY-MM-DD."),
    end_date: nullableDate.optional(),
  })
  .refine(
    (values) => {
      if (!values.end_date) {
        return true
      }

      return values.end_date >= values.start_date
    },
    {
      message: "End date must be on or after start date.",
      path: ["end_date"],
    }
  )

type BudgetFormValues = z.infer<typeof budgetFormSchema>

interface BudgetFormProps {
  open: boolean
  mode: "create" | "edit"
  isSubmitting: boolean
  budget?: BudgetWithRelations | null
  categories: Category[]
  accounts: Account[]
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CreateBudgetInput) => Promise<void>
}

function formatDateForInput(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  return value.slice(0, 10)
}

function getDefaultValues(budget?: BudgetWithRelations | null): BudgetFormValues {
  const today = new Date().toISOString().slice(0, 10)

  if (!budget) {
    return {
      name: "",
      amount: 0,
      period: "monthly",
      category_id: "none",
      account_id: "none",
      alert_percentage: "",
      start_date: today,
      end_date: "",
    }
  }

  return {
    name: budget.name,
    amount: typeof budget.amount === "string" ? Number(budget.amount) : budget.amount,
    period: budget.period,
    category_id: budget.category_id ?? "none",
    account_id: budget.account_id ?? "none",
    alert_percentage: budget.alert_percentage ?? "",
    start_date: formatDateForInput(budget.start_date),
    end_date: formatDateForInput(budget.end_date),
  }
}

export function BudgetForm({
  open,
  mode,
  isSubmitting,
  budget,
  categories,
  accounts,
  onOpenChange,
  onSubmit,
}: BudgetFormProps) {
  const defaultValues = useMemo(() => getDefaultValues(budget), [budget])

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(defaultValues)
  }, [defaultValues, form, open])

  const submitLabel = mode === "create" ? "Create Budget" : "Save Changes"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Budget" : "Edit Budget"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Define a spending limit and track progress automatically."
              : "Update your budget settings and thresholds."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const payload: CreateBudgetInput = {
                name: values.name,
                amount: values.amount,
                period: values.period,
                category_id:
                  !values.category_id || values.category_id === "none"
                    ? null
                    : values.category_id,
                account_id:
                  !values.account_id || values.account_id === "none"
                    ? null
                    : values.account_id,
                alert_percentage:
                  values.alert_percentage === "" || values.alert_percentage === undefined
                    ? null
                    : Number(values.alert_percentage),
                start_date: values.start_date,
                end_date: values.end_date ? values.end_date : null,
              }

              await onSubmit(payload)
            })}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Budget Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Monthly Food Budget"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">All categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Leave as "All categories" for an overall budget.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All accounts" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">All accounts</SelectItem>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Use a specific account budget or keep it global.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alert_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Percentage</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder="80"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Notify when usage reaches this threshold.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormDescription>
                      Keep blank for an ongoing budget with no fixed end date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
