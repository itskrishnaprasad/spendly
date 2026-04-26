"use client"

import { useCallback, useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { Account, Category, Transaction } from "@/types/base"
import type { TransactionType } from "@/types/enums"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
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
import { updateTransactionSchema } from "@/utils/validations/transactions"

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

type ApiActionResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string }

const editTransactionFormSchema = z.object({
  account_id: z.string().uuid("Select an account."),
  category_id: z.string().uuid("Select a category."),
  type: z.enum(["income", "expense"] as const),
  amount: z.number().finite().positive("Amount must be greater than 0."),
  title: z.string().trim().min(1, "Title is required."),
  note: z.string().trim().optional().default(""),
  transaction_date: z.string().min(1, "Date is required."),
})

type EditTransactionFormValues = z.infer<typeof editTransactionFormSchema>

export function TransactionRowActions({
  transaction,
  accounts,
  categories,
  onTransactionChanged,
}: {
  transaction: Transaction
  accounts: Account[]
  categories: Category[]
  onTransactionChanged: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<TransactionType>(transaction.type)
  const [transactionCategories, setTransactionCategories] = useState<Category[]>(categories)

  const form = useForm<EditTransactionFormValues>({
    resolver: zodResolver(editTransactionFormSchema),
    defaultValues: {
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      type: transaction.type,
      amount:
        typeof transaction.amount === "string"
          ? Number(transaction.amount)
          : transaction.amount,
      title: transaction.title,
      note: transaction.note ?? "",
      transaction_date: transaction.transaction_date,
    },
  })

  const fetchCategories = useCallback(async (type: TransactionType) => {
    const response = await fetch(`/api/categories?type=${type}`, {
      cache: "no-store",
    })

    const payload = (await response.json()) as
      | ApiSuccessResponse<Category[]>
      | ApiErrorResponse

    if (!response.ok || !payload.success) {
      const message =
        "message" in payload ? payload.message : "Failed to load categories."
      throw new Error(message)
    }

    setTransactionCategories(payload.data)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      type: transaction.type,
      amount:
        typeof transaction.amount === "string"
          ? Number(transaction.amount)
          : transaction.amount,
      title: transaction.title,
      note: transaction.note ?? "",
      transaction_date: transaction.transaction_date,
    })
    setSelectedType(transaction.type)
    setTransactionCategories(categories)
  }, [categories, form, open, transaction])

  useEffect(() => {
    if (!open) {
      return
    }

    void fetchCategories(selectedType)
  }, [fetchCategories, open, selectedType])

  const onSubmitEdit = async (values: EditTransactionFormValues) => {
    const parsedPayload = updateTransactionSchema.safeParse({
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

    setIsEditLoading(true)

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedPayload.data),
      })

      const data = (await response.json()) as ApiActionResponse<Transaction>

      if (!response.ok || !data.success) {
        const message =
          "message" in data ? data.message : "Failed to update transaction."
        toast.error(message)
        return
      }

      toast.success(data.message ?? "Transaction updated successfully.")
      setOpen(false)
      onTransactionChanged()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update transaction."
      )
    } finally {
      setIsEditLoading(false)
    }
  }

  const onDeleteTransaction = async () => {
    setIsDeleteLoading(true)

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      })

      const data = (await response.json()) as ApiActionResponse<{ id: string }>

      if (!response.ok || !data.success) {
        const message =
          "message" in data ? data.message : "Failed to delete transaction."
        toast.error(message)
        return
      }

      toast.success(data.message ?? "Transaction deleted successfully.", {
        position: "top-center",
      })
      onTransactionChanged()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete transaction."
      )
    } finally {
      setIsDeleteLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={isEditLoading || isDeleteLoading}
            aria-label={`Open actions for ${transaction.title}`}
          >
            <EllipsisVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 min-w-40">
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={onDeleteTransaction}
            disabled={isDeleteLoading}
          >
            <Trash2Icon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grocery run" {...field} disabled={isEditLoading} />
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
                        form.setValue("category_id", "")
                      }}
                      disabled={isEditLoading}
                    >
                      <FormControl>
                        <SelectTrigger disabled={isEditLoading}>
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
                    <Select value={field.value} onValueChange={field.onChange} disabled={isEditLoading}>
                      <FormControl>
                        <SelectTrigger disabled={isEditLoading}>
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
                    <Select value={field.value} onValueChange={field.onChange} disabled={isEditLoading}>
                      <FormControl>
                        <SelectTrigger disabled={isEditLoading}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionCategories.map((category) => (
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
                          disabled={isEditLoading}
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
                        <Input type="date" {...field} disabled={isEditLoading} />
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
                      <Input placeholder="Optional note" {...field} disabled={isEditLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditLoading}>
                  {isEditLoading ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
