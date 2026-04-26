"use client"

import { useState } from "react"
import type { Account, Category } from "@/types/base"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { DateFilterField } from "./date-filter-field"

export type TransactionFilters = {
  accountId: string
  categoryId: string
  search: string
  from: string
  to: string
}

const ALL_FILTER_VALUE = "__all__"

export function TransactionFiltersPanel({
  accounts,
  categories,
  accountsLoading,
  categoriesLoading,
  filters,
  limit,
  onFiltersChange,
  onPageReset,
  onLimitChange,
  onClearFilters,
}: {
  accounts: Account[]
  categories: Category[]
  accountsLoading: boolean
  categoriesLoading: boolean
  filters: TransactionFilters
  limit: number
  onFiltersChange: (updater: (previous: TransactionFilters) => TransactionFilters) => void
  onPageReset: () => void
  onLimitChange: (value: number) => void
  onClearFilters: () => void
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  return (
    <div className="rounded-lg border p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="transaction-search">Search</Label>
          <Input
            id="transaction-search"
            placeholder="Search transactions"
            value={filters.search}
            onChange={(event) => {
              onFiltersChange((previous) => ({
                ...previous,
                search: event.target.value,
              }))
              onPageReset()
            }}
          />
        </div>

        <div className="space-y-2 lg:justify-self-end lg:w-full">
          <Label>Category</Label>
          <Select
            value={filters.categoryId || ALL_FILTER_VALUE}
            onValueChange={(value) => {
              onFiltersChange((previous) => ({
                ...previous,
                categoryId: value === ALL_FILTER_VALUE ? "" : value,
              }))
              onPageReset()
            }}
            disabled={categoriesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Sheet open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline">
              Advanced filters
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Advanced filters</SheetTitle>
              <SheetDescription>
                Refine the transaction list with date range and page size.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <DateFilterField
                label="From"
                value={filters.from}
                placeholder="Pick a start date"
                onChange={(value) => {
                  onFiltersChange((previous) => ({
                    ...previous,
                    from: value,
                  }))
                  onPageReset()
                }}
              />
              <DateFilterField
                label="To"
                value={filters.to}
                placeholder="Pick an end date"
                onChange={(value) => {
                  onFiltersChange((previous) => ({
                    ...previous,
                    to: value,
                  }))
                  onPageReset()
                }}
              />
              <div className="space-y-2">
                <Label>Page size</Label>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    onLimitChange(Number(value))
                    onPageReset()
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 / page</SelectItem>
                    <SelectItem value="24">24 / page</SelectItem>
                    <SelectItem value="48">48 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-auto flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onClearFilters()
                    setAdvancedOpen(false)
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <p className="text-sm text-muted-foreground">
          Use advanced filters for date range and page size.
        </p>
      </div>
    </div>
  )
}
