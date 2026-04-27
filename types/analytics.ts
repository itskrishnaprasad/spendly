

export interface ExpenseByCategory {
  category_id: string
  category_name: string
  category_color: string | null
  total: number
}

export interface MonthlyOverview {
  month: string
  income: number
  expense: number
  savings: number
}
