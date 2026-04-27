import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface BudgetHeaderProps {
  onCreateBudget: () => void
}

export function BudgetHeader({ onCreateBudget }: BudgetHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/70 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Manage your spending limits and financial goals
        </p>
      </div>
      <Button type="button" onClick={onCreateBudget} className="sm:w-auto">
        <PlusIcon />
        Create Budget
      </Button>
    </section>
  )
}
