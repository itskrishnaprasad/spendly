"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import type { Account } from "@/types/base"
import type { AccountType } from "@/types/enums"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAccountSchema } from "@/utils/validations/category"

const createAccountFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  type: z.enum(["cash", "bank", "wallet", "credit_card"] as const),
  balance: z.number().finite().optional(),
})

type CreateAccountFormValues = z.infer<typeof createAccountFormSchema>

type ApiActionResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string }

interface CreateAccountDialogProps {
  onAccountCreated?: (account: Account) => void
}

export function CreateAccountDialog({ onAccountCreated }: CreateAccountDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountFormSchema),
    defaultValues: {
      name: "",
      type: "cash",
      balance: 0,
    },
  })

  const onSubmit = async (values: CreateAccountFormValues) => {
    const parsedPayload = createAccountSchema.safeParse({
      name: values.name,
      type: values.type,
      balance: values.balance,
    })

    if (!parsedPayload.success) {
      toast.error(parsedPayload.error.issues[0]?.message ?? "Invalid account data.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedPayload.data),
      })

      const data = (await response.json()) as ApiActionResponse<Account>

      if (!response.ok || !data.success) {
        const message = "message" in data ? data.message : "Failed to create account."
        toast.error(message)
        return
      }

      toast.success(data.message ?? "Account created successfully.")
      form.reset({
        name: "",
        type: "cash",
        balance: 0,
      })
      setOpen(false)
      onAccountCreated?.(data.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create account.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <PlusIcon />
          Create Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>
            Add a new account to track your balances.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Bank" {...field} disabled={isLoading} />
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
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const value = event.target.value
                        field.onChange(value === "" ? undefined : Number(value))
                      }}
                      disabled={isLoading}
                    />
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
