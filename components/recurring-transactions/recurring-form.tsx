"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import type { Account, Category } from "@/types/base"
import type { RecurringTransactionWithRelations } from "@/types/recurring-transaction"
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
import {
  createRecurringTransactionSchema,
  recurringFrequencySchema,
} from "@/utils/validations/recurring-transaction"

const formSchema = createRecurringTransactionSchema

type RecurringFormValues = z.infer<typeof formSchema>

interface RecurringFormProps {
  open: boolean
  mode: "create" | "edit"
  recurring?: RecurringTransactionWithRelations | null
  accounts: Account[]
  categories: Category[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: RecurringFormValues) => Promise<void>
}

function formatDateForInput(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  return value.slice(0, 10)
}

function getDefaultValues(recurring?: RecurringTransactionWithRelations | null): RecurringFormValues {
  const today = new Date().toISOString().slice(0, 10)

  if (!recurring) {
    return {
      account_id: "" as never,
      category_id: "" as never,
      type: "expense",
      amount: 0,
      title: "",
      note: "",
      frequency: "monthly",
      interval_count: 1,
      start_date: today,
      end_date: null,
      is_active: true,
    }
  }

  return {
    account_id: recurring.account_id,
    category_id: recurring.category_id,
    type: recurring.type,
    amount: typeof recurring.amount === "string" ? Number(recurring.amount) : recurring.amount,
    title: recurring.title,
    note: recurring.note ?? "",
    frequency: recurring.frequency,
    interval_count: recurring.interval_count ?? 1,
    start_date: formatDateForInput(recurring.start_date),
    end_date: formatDateForInput(recurring.end_date) || null,
    is_active: recurring.is_active ?? true,
  }
}

export function RecurringForm({
  open,
  mode,
  recurring,
  accounts,
  categories,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: RecurringFormProps) {
  const defaultValues = useMemo(() => getDefaultValues(recurring), [recurring])

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(defaultValues)
  }, [defaultValues, form, open])

  const selectedType = useWatch({ control: form.control, name: "type" }) ?? "expense"
  const filteredCategories = categories.filter((category) => category.type === selectedType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Recurring Transaction" : "Edit Recurring Transaction"}
          </DialogTitle>
          <DialogDescription>
            Automate future income and expenses with a reusable schedule.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit(values)
            })}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Rent, Salary, Subscriptions"
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
                        step="0.01"
                        min="0"
                        value={field.value ?? ""}
                        onChange={(event) => {
                          field.onChange(
                            event.target.value === "" ? undefined : Number(event.target.value)
                          )
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue("category_id", "", { shouldValidate: true })
                      }}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recurringFrequencySchema.options.map((frequency) => (
                          <SelectItem key={frequency} value={frequency}>
                            {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interval_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interval Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={field.value ?? ""}
                        onChange={(event) => {
                          field.onChange(
                            event.target.value === "" ? undefined : Number(event.target.value)
                          )
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Every 2 weeks, every 3 days, etc.</FormDescription>
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
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
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
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Leave blank for an open-ended automation.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional context for this automation"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isSubmitting}
                      />
                    </FormControl>
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
                {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
