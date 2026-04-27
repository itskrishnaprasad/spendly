import type { Account, Budget as BaseBudget, Category } from "@/types/base"
import type { BudgetPeriod } from "@/types/enums"
import type { ISODateString, UUID } from "@/types/primitives"


export interface CreateBudgetInput {
  category_id?: UUID | null
  account_id?: UUID | null
  name: string
  amount: number
  period: BudgetPeriod
  start_date: ISODateString
  end_date?: ISODateString | null
  alert_percentage?: number | null
  is_active?: boolean
}

export interface UpdateBudgetInput {
  category_id?: UUID | null
  account_id?: UUID | null
  name?: string
  amount?: number
  period?: BudgetPeriod
  start_date?: ISODateString
  end_date?: ISODateString | null
  alert_percentage?: number | null
  is_active?: boolean
}

export interface BudgetWithRelations extends BaseBudget {
  category: Pick<Category, "id" | "name" | "color" | "icon" | "type"> | null
  account: Pick<Account, "id" | "name" | "type" | "color" | "icon"> | null
}

export interface BudgetProgress {
  id: UUID
  name: string
  period: BudgetPeriod
  budget_amount: number
  spent_amount: number
  remaining_amount: number
  progress_percentage: number
  is_exceeded: boolean
  is_alert_reached: boolean
  start_date: ISODateString
  end_date: ISODateString | null
  period_start_date: ISODateString
  period_end_date: ISODateString
  category: Pick<Category, "id" | "name" | "color" | "icon" | "type"> | null
  account: Pick<Account, "id" | "name" | "type" | "color" | "icon"> | null
}
