import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface RecurringHeaderProps {
  onCreateRecurring: () => void
}

export function RecurringHeader({ onCreateRecurring }: RecurringHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/70 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Recurring Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Automate your recurring income and expenses
        </p>
      </div>
      <Button type="button" onClick={onCreateRecurring} className="sm:w-auto">
        <PlusIcon />
        Create Recurring
      </Button>
    </section>
  )
}
