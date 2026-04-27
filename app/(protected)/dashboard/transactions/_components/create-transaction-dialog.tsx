"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import type { Account, Category, Transaction } from "@/types/base"
import type { TransactionType } from "@/types/enums"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTransactionSchema } from "@/utils/validations/transaction"

const createTransactionFormSchema = z.object({
  account_id: z.string().uuid("Select an account."),
  category_id: z.string().uuid("Select a category."),
  type: z.enum(["income", "expense"] as const),
  amount: z.number().finite().positive("Amount must be greater than 0."),
  title: z.string().trim().min(1, "Title is required."),
  note: z.string().trim(),
  transaction_date: z.string().min(1, "Date is required."),
})

type CreateTransactionFormValues = z.infer<typeof createTransactionFormSchema>

type ApiActionResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string }

interface CreateTransactionDialogProps {
  defaultType: TransactionType
  onTransactionCreated?: (transaction: Transaction) => void
}

export function CreateTransactionDialog({
  defaultType,
  onTransactionCreated,
}: CreateTransactionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isOptionsLoading, setIsOptionsLoading] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState<TransactionType>(defaultType)

  const form = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionFormSchema),
    defaultValues: {
      account_id: "",
      category_id: "",
      type: defaultType,
      amount: 0,
      title: "",
      note: "",
      transaction_date: new Date().toISOString().slice(0, 10),
    },
  })

  const fetchOptions = React.useCallback(async () => {
    setIsOptionsLoading(true)

    try {
      const [accountsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/accounts", { cache: "no-store" }),
        fetch(`/api/categories?type=${selectedType}`, { cache: "no-store" }),
      ])

      const accountsPayload = (await accountsResponse.json()) as
        | { success: true; data: Account[] }
        | { success: false; message: string }
      const categoriesPayload = (await categoriesResponse.json()) as
        | { success: true; data: Category[] }
        | { success: false; message: string }

      if (!accountsResponse.ok || !accountsPayload.success) {
        throw new Error(
          "message" in accountsPayload
            ? accountsPayload.message
            : "Failed to load accounts."
        )
      }

      if (!categoriesResponse.ok || !categoriesPayload.success) {
        throw new Error(
          "message" in categoriesPayload
            ? categoriesPayload.message
            : "Failed to load categories."
        )
      }

      setAccounts(accountsPayload.data)
      setCategories(categoriesPayload.data)
    } finally {
      setIsOptionsLoading(false)
    }
  }, [selectedType])

  React.useEffect(() => {
    if (!open) {
      return
    }

    void fetchOptions()
  }, [fetchOptions, open])

  React.useEffect(() => {
    if (!open) {
      return
    }

    setSelectedType(defaultType)
    form.reset({
      account_id: "",
      category_id: "",
      type: defaultType,
      amount: 0,
      title: "",
      note: "",
      transaction_date: new Date().toISOString().slice(0, 10),
    })
  }, [defaultType, form, open])

  React.useEffect(() => {
    if (!open) {
      return
    }

    form.setValue("category_id", "")
    void fetchOptions()
  }, [fetchOptions, form, open, selectedType])

  const onSubmit = async (values: CreateTransactionFormValues) => {
    const parsedPayload = createTransactionSchema.safeParse({
      account_id: values.account_id,
      category_id: values.category_id,
      type: values.type,
      amount: values.amount,
      title: values.title,
      note: values.note?.trim() || undefined,
      transaction_date: values.transaction_date,
    })

    if (!parsedPayload.success) {
      toast.error(
        parsedPayload.error.issues[0]?.message ?? "Invalid transaction data."
      )
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedPayload.data),
      })

      const data = (await response.json()) as ApiActionResponse<Transaction>

      if (!response.ok || !data.success) {
        const message =
          "message" in data ? data.message : "Failed to create transaction."
        toast.error(message)
        return
      }

      toast.success(data.message ?? "Transaction created successfully.")
      form.reset({
        account_id: "",
        category_id: "",
        type: defaultType,
        amount: 0,
        title: "",
        note: "",
        transaction_date: new Date().toISOString().slice(0, 10),
      })
      setOpen(false)
      onTransactionCreated?.(data.data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create transaction."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <PlusIcon />
          Create Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Add a new income or expense transaction.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Grocery run" {...field} disabled={isLoading || isOptionsLoading} />
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
                      setSelectedType(value as TransactionType)
                    }}
                    disabled={isLoading || isOptionsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoading || isOptionsLoading}>
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
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoading || isOptionsLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const value = event.target.value
                          field.onChange(value === "" ? 0 : Number(value))
                        }}
                        disabled={isLoading || isOptionsLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} disabled={isLoading || isOptionsLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional note" {...field} disabled={isLoading || isOptionsLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || isOptionsLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
