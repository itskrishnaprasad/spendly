import { CalendarClockIcon, EllipsisVerticalIcon, PencilIcon, PauseCircleIcon, PlayCircleIcon, Trash2Icon } from "lucide-react"
import { format, parseISO } from "date-fns"

import type { RecurringTransactionWithRelations } from "@/types/recurring-transaction"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function formatCurrency(value: number | string | null | undefined) {
  const numeric = typeof value === "string" ? Number(value) : value ?? 0

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0)
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  return format(parseISO(value), "MMM d, yyyy")
}

interface RecurringCardProps {
  recurring: RecurringTransactionWithRelations
  onEdit: (item: RecurringTransactionWithRelations) => void
  onDelete: (item: RecurringTransactionWithRelations) => void
  onToggleActive: (item: RecurringTransactionWithRelations) => void
}

export function RecurringCard({ recurring, onEdit, onDelete, onToggleActive }: RecurringCardProps) {
  const isActive = recurring.is_active !== false
  const isIncome = recurring.type === "income"

  return (
    <Card className="h-full border-border/60 bg-card/85 shadow-xs">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{recurring.title}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={isIncome ? "default" : "secondary"}>
                {isIncome ? "Income" : "Expense"}
              </Badge>
              <Badge variant={isActive ? "outline" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${recurring.title}`}>
                <EllipsisVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 min-w-44">
              <DropdownMenuItem onSelect={() => onEdit(recurring)}>
                <PencilIcon className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onToggleActive(recurring)}>
                {isActive ? <PauseCircleIcon className="size-4" /> : <PlayCircleIcon className="size-4" />}
                {isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(recurring)}>
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
          <div>
            <p className="text-xs text-muted-foreground">Next Run</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(recurring.next_run_date)}</p>
          </div>
          <CalendarClockIcon className="size-5 text-primary" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className={isIncome ? "font-semibold text-primary" : "font-semibold text-destructive"}>
              {isIncome ? "+" : "-"}
              {formatCurrency(recurring.amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Frequency</p>
            <p className="font-medium">{recurring.frequency}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Interval</p>
            <p className="font-medium">Every {recurring.interval_count ?? 1}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Run</p>
            <p className="font-medium">{formatDate(recurring.last_run_date)}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Account</span>
            <span className="truncate font-medium">{recurring.account?.name ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Category</span>
            <span className="truncate font-medium">{recurring.category?.name ?? "-"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
