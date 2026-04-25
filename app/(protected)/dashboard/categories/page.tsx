"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircleIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import type { Category } from "@/types/base"
import type { TransactionType } from "@/types/enums"
import { CreateCategoryDialog } from "@/components/create-category-dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/utils/validations/category"

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

type CategoryTabState = {
  loading: boolean
  categories: Category[]
  error: string | null
}

type ApiActionResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string }

const initialTabState: CategoryTabState = {
  loading: false,
  categories: [],
  error: null,
}

const editCategoryFormSchema = createCategorySchema.pick({
  name: true,
  type: true,
})

type EditCategoryFormValues = z.infer<typeof editCategoryFormSchema>

function CategoryCardActions({
  category,
  onCategoryChanged,
}: {
  category: Category
  onCategoryChanged: () => void
}) {
  const isDefaultCategory = Boolean(category.is_default)
  const [open, setOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)

  const form = useForm<EditCategoryFormValues>({
    resolver: zodResolver(editCategoryFormSchema),
    defaultValues: {
      name: category.name,
      type: category.type,
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      name: category.name,
      type: category.type,
    })
  }, [category.name, category.type, form, open])

  const onSubmitEdit = async (values: EditCategoryFormValues) => {
    const parsedPayload = updateCategorySchema.safeParse({
      name: values.name,
      type: values.type,
    })

    if (!parsedPayload.success) {
      toast.error(parsedPayload.error.issues[0]?.message ?? "Invalid category data.")
      return
    }

    setIsEditLoading(true)

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedPayload.data),
      })

      const data = (await response.json()) as ApiActionResponse<Category>

      if (!response.ok || !data.success) {
        const message = "message" in data ? data.message : "Failed to update category."
        toast.error(message)
        return
      }

      toast.success(data.message ?? "Category updated successfully.")
      setOpen(false)
      onCategoryChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update category.")
    } finally {
      setIsEditLoading(false)
    }
  }

  const onDeleteCategory = async () => {
    setIsDeleteLoading(true)

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      })

      const data = (await response.json()) as ApiActionResponse<Category>

      if (!response.ok || !data.success) {
        const message = "message" in data ? data.message : "Failed to delete category."
        toast.error(message)
        return
      }

      toast.success(data.message ?? "Category deleted successfully.", {
        position: "top-center",
      })
      onCategoryChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category.")
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
            aria-label={`Open actions for ${category.name}`}
          >
            <EllipsisVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 min-w-40">
          <DropdownMenuItem
            onSelect={() => setOpen(true)}
            disabled={isDefaultCategory}
          >
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={onDeleteCategory}
            disabled={isDeleteLoading || isDefaultCategory}
          >
            <Trash2Icon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name and type.
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
                      <Input placeholder="e.g., Groceries" {...field} disabled={isEditLoading} />
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
                          <SelectValue placeholder="Select a type" />
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

function CategorySkeletonCards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:gap-4 2xl:grid-cols-4">
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
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CategoryCards({
  categories,
  onCategoryChanged,
}: {
  categories: Category[]
  onCategoryChanged: () => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:gap-4 2xl:grid-cols-4">
      {categories.map((category) => (
        <Card key={category.id} className="h-full">
          <CardHeader className="space-y-3 pb-3">
            <CardTitle className="flex items-start justify-between gap-2 text-base">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted"
                  aria-hidden="true"
                >
                  {category.type === "income" ? (
                    <ArrowUpRightIcon className="size-4 text-emerald-600" />
                  ) : (
                    <ArrowDownRightIcon className="size-4 text-rose-600" />
                  )}
                </span>
                <span className="truncate">{category.name}</span>
              </span>
              <CategoryCardActions
                category={category}
                onCategoryChanged={onCategoryChanged}
              />
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-2">
              <Badge variant={category.type === "income" ? "default" : "secondary"}>
                {category.type === "income" ? "Income" : "Expense"}
              </Badge>
              <Badge variant="outline">
                {category.is_default ? "Default" : "Custom"}
              </Badge>
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<TransactionType>("expense")
  const [refetchKey, setRefetchKey] = useState(0)
  const [tabState, setTabState] = useState<Record<TransactionType, CategoryTabState>>({
    expense: initialTabState,
    income: initialTabState,
  })

  useEffect(() => {
    let isMounted = true

    async function fetchCategories(type: TransactionType) {
      setTabState((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          loading: true,
          error: null,
        },
      }))

      try {
        const response = await fetch(`/api/categories?type=${type}`, {
          method: "GET",
          cache: "no-store",
        })

        const payload = (await response.json()) as
          | ApiSuccessResponse<Category[]>
          | ApiErrorResponse

        if (!response.ok || !payload.success) {
          const message =
            "message" in payload
              ? payload.message
              : "Failed to load categories."
          throw new Error(message)
        }

        if (!isMounted) {
          return
        }

        setTabState((prev) => ({
          ...prev,
          [type]: {
            loading: false,
            categories: payload.data,
            error: null,
          },
        }))
      } catch (error) {
        if (!isMounted) {
          return
        }

        setTabState((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load categories.",
          },
        }))
      }
    }

    void fetchCategories(activeTab)

    return () => {
      isMounted = false
    }
  }, [activeTab, refetchKey])

  const currentState = tabState[activeTab]

  const handleCategoryCreated = useCallback(() => {
    setRefetchKey((prev) => prev + 1)
  }, [])

  const handleCategoryChanged = useCallback(() => {
    setRefetchKey((prev) => prev + 1)
  }, [])

  return (
    <main className="flex w-full flex-col gap-6">
      <section className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your income and expense categories.
          </p>
        </div>
        <CreateCategoryDialog onCategoryCreated={handleCategoryCreated} />
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (value === "expense" || value === "income") {
            setActiveTab(value)
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="space-y-4">
          {activeTab === "expense" &&
            (currentState.loading ? (
              <CategorySkeletonCards />
            ) : currentState.error ? (
              <EmptyState>
                <AlertCircleIcon className="size-5 text-muted-foreground" />
                <EmptyStateTitle className="mt-3">Unable to load categories</EmptyStateTitle>
                <EmptyStateDescription>{currentState.error}</EmptyStateDescription>
              </EmptyState>
            ) : currentState.categories.length === 0 ? (
              <EmptyState>
                <TagIcon className="size-5 text-muted-foreground" />
                <EmptyStateTitle className="mt-3">No expense categories found</EmptyStateTitle>
                <EmptyStateDescription>
                  Start by creating your first expense category.
                </EmptyStateDescription>
                <div className="mt-4">
                  <CreateCategoryDialog onCategoryCreated={handleCategoryCreated} />
                </div>
              </EmptyState>
            ) : (
              <CategoryCards
                categories={currentState.categories}
                onCategoryChanged={handleCategoryChanged}
              />
            ))}
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          {activeTab === "income" &&
            (currentState.loading ? (
              <CategorySkeletonCards />
            ) : currentState.error ? (
              <EmptyState>
                <AlertCircleIcon className="size-5 text-muted-foreground" />
                <EmptyStateTitle className="mt-3">Unable to load categories</EmptyStateTitle>
                <EmptyStateDescription>{currentState.error}</EmptyStateDescription>
              </EmptyState>
            ) : currentState.categories.length === 0 ? (
              <EmptyState>
                <TagIcon className="size-5 text-muted-foreground" />
                <EmptyStateTitle className="mt-3">No income categories found</EmptyStateTitle>
                <EmptyStateDescription>
                  Start by creating your first income category.
                </EmptyStateDescription>
                <div className="mt-4">
                  <CreateCategoryDialog onCategoryCreated={handleCategoryCreated} />
                </div>
              </EmptyState>
            ) : (
              <CategoryCards
                categories={currentState.categories}
                onCategoryChanged={handleCategoryChanged}
              />
            ))}
        </TabsContent>
      </Tabs>
    </main>
  )
}
