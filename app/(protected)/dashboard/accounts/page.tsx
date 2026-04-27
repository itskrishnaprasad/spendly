"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircleIcon,
  Building2Icon,
  EllipsisVerticalIcon,
  LandmarkIcon,
  PencilIcon,
  PiggyBankIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import type { Account } from "@/types/base"
import type { AccountType } from "@/types/enums"
import { CreateAccountDialog } from "@/components/create-account-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  createAccountSchema,
  updateAccountSchema,
} from "@/utils/validations/category"

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

type AccountsState = {
  loading: boolean
  accounts: Account[]
  error: string | null
}

type ApiActionResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string }

const initialState: AccountsState = {
  loading: false,
  accounts: [],
  error: null,
}

const editAccountFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  type: z.enum(["cash", "bank", "wallet", "credit_card"] as const),
  balance: z.number().finite().optional(),
  is_archived: z.boolean(),
})

type EditAccountFormValues = z.infer<typeof editAccountFormSchema>

function getAccountIcon(type: AccountType) {
  switch (type) {
    case "bank":
      return <LandmarkIcon className="size-4 text-primary" />
    case "wallet":
      return <WalletIcon className="size-4 text-chart-2" />
    case "credit_card":
      return <Building2Icon className="size-4 text-chart-3" />
    case "cash":
    default:
      return <PiggyBankIcon className="size-4 text-chart-4" />
  }
}

function formatBalance(value: Account["balance"]) {
  if (value === null || value === undefined) {
    return "$0.00"
  }

  const numeric = typeof value === "string" ? Number(value) : value

  if (Number.isNaN(numeric)) {
    return "$0.00"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric)
}

function AccountCardActions({
  account,
  onAccountChanged,
}: {
  account: Account
  onAccountChanged: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)

  const form = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountFormSchema),
    defaultValues: {
      name: account.name,
      type: account.type,
      balance:
        account.balance === null
          ? 0
          : typeof account.balance === "string"
            ? Number(account.balance)
            : account.balance,
      is_archived: Boolean(account.is_archived),
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      name: account.name,
      type: account.type,
      balance:
        account.balance === null
          ? 0
          : typeof account.balance === "string"
            ? Number(account.balance)
            : account.balance,
      is_archived: Boolean(account.is_archived),
    })
  }, [account.balance, account.is_archived, account.name, account.type, form, open])

  const onSubmitEdit = async (values: EditAccountFormValues) => {
    const parsedPayload = updateAccountSchema.safeParse({
      name: values.name,
      type: values.type,
      balance: values.balance,
      is_archived: values.is_archived,
    })

    if (!parsedPayload.success) {
      toast.error(parsedPayload.error.issues[0]?.message ?? "Invalid account data.")
      return
    }

    setIsEditLoading(true)

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedPayload.data),
      })

      const data = (await response.json()) as ApiActionResponse<Account>

      if (!response.ok || !data.success) {
        const message = "message" in data ? data.message : "Failed to update account."
        toast.error(message)
        return
      }

      toast.success(data.message ?? "Account updated successfully.")
      setOpen(false)
      onAccountChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update account.")
    } finally {
      setIsEditLoading(false)
    }
  }

  const onDeleteAccount = async () => {
    setIsDeleteLoading(true)

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
      })

      const data = (await response.json()) as ApiActionResponse<{ id: string }>

      if (!response.ok || !data.success) {
        const message = "message" in data ? data.message : "Failed to delete account."
        toast.error(message)
        return
      }

      toast.success(data.message ?? "Account deleted successfully.", {
        position: "top-center",
      })
      onAccountChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account.")
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
            aria-label={`Open actions for ${account.name}`}
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
            onSelect={onDeleteAccount}
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
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update the account details.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Bank" {...field} disabled={isEditLoading} />
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
                      onValueChange={field.onChange}
                      disabled={isEditLoading}
                    >
                      <FormControl>
                        <SelectTrigger disabled={isEditLoading}>
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
                    <FormLabel>Balance</FormLabel>
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
                        disabled={isEditLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_archived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value ? "archived" : "active"}
                      onValueChange={(value) => field.onChange(value === "archived")}
                      disabled={isEditLoading}
                    >
                      <FormControl>
                        <SelectTrigger disabled={isEditLoading}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
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

function AccountSkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:gap-4 2xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AccountCards({
  accounts,
  onAccountChanged,
}: {
  accounts: Account[]
  onAccountChanged: () => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:gap-4 2xl:grid-cols-4">
      {accounts.map((account) => (
        <Card key={account.id} className="h-full">
          <CardHeader className="space-y-3 pb-2">
            <CardTitle className="flex items-start justify-between gap-2 text-base">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted"
                  aria-hidden="true"
                >
                  {getAccountIcon(account.type)}
                </span>
                <span className="truncate">{account.name}</span>
              </span>
              <AccountCardActions
                account={account}
                onAccountChanged={onAccountChanged}
              />
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-2">
              <Badge variant="secondary">{account.type.replace("_", " ")}</Badge>
              <Badge variant={account.is_archived ? "outline" : "default"}>
                {account.is_archived ? "Archived" : "Active"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold">{formatBalance(account.balance)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AccountsPage() {
  const [refetchKey, setRefetchKey] = useState(0)
  const [state, setState] = useState<AccountsState>(initialState)

  useEffect(() => {
    let isMounted = true

    async function fetchAccounts() {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }))

      try {
        const response = await fetch("/api/accounts", {
          method: "GET",
          cache: "no-store",
        })

        const payload = (await response.json()) as
          | ApiSuccessResponse<Account[]>
          | ApiErrorResponse

        if (!response.ok || !payload.success) {
          const message =
            "message" in payload
              ? payload.message
              : "Failed to load accounts."
          throw new Error(message)
        }

        if (!isMounted) {
          return
        }

        setState({
          loading: false,
          accounts: payload.data,
          error: null,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load accounts.",
        }))
      }
    }

    void fetchAccounts()

    return () => {
      isMounted = false
    }
  }, [refetchKey])

  const handleAccountChanged = useCallback(() => {
    setRefetchKey((prev) => prev + 1)
  }, [])

  return (
    <main className="flex w-full flex-col gap-6">
      <section className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your financial accounts and balances.
          </p>
        </div>
        <CreateAccountDialog onAccountCreated={handleAccountChanged} />
      </section>

      {state.loading ? (
        <AccountSkeletonCards />
      ) : state.error ? (
        <EmptyState>
          <AlertCircleIcon className="size-5 text-muted-foreground" />
          <EmptyStateTitle className="mt-3">Unable to load accounts</EmptyStateTitle>
          <EmptyStateDescription>{state.error}</EmptyStateDescription>
        </EmptyState>
      ) : state.accounts.length === 0 ? (
        <EmptyState>
          <WalletIcon className="size-5 text-muted-foreground" />
          <EmptyStateTitle className="mt-3">No accounts found</EmptyStateTitle>
          <EmptyStateDescription>
            Start by creating your first account.
          </EmptyStateDescription>
          <div className="mt-4">
            <CreateAccountDialog onAccountCreated={handleAccountChanged} />
          </div>
        </EmptyState>
      ) : (
        <AccountCards
          accounts={state.accounts}
          onAccountChanged={handleAccountChanged}
        />
      )}
    </main>
  )
}
