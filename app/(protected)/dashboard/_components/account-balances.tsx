import { Building2Icon, LandmarkIcon, WalletIcon } from "lucide-react"

import type { Account } from "@/types/base"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { formatCurrency, humanizeLabel } from "./dashboard-utils"

type AccountBalancesProps = {
  data: Account[] | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

const iconMap = {
  cash: WalletIcon,
  bank: LandmarkIcon,
  wallet: WalletIcon,
  credit_card: Building2Icon,
  default: WalletIcon,
} as const

function AccountBalancesSkeleton() {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
      </CardContent>
    </Card>
  )
}

function getAccountIcon(type: Account["type"]) {
  return iconMap[type] ?? iconMap.default
}

export function AccountBalances({ data, loading, error, onRetry }: AccountBalancesProps) {
  if (loading) {
    return <AccountBalancesSkeleton />
  }

  if (error) {
    return (
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle>Account balances</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        {onRetry ? (
          <CardContent className="pt-0">
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </CardContent>
        ) : null}
      </Card>
    )
  }

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <CardTitle>Account balances</CardTitle>
        <CardDescription>
          Current balances across all active accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data?.length ? (
          data.map((account) => {
            const Icon = getAccountIcon(account.type)

            return (
              <div
                key={account.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-11 rounded-xl">
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline">{humanizeLabel(account.type)}</Badge>
                      {account.is_archived ? (
                        <Badge variant="secondary">Archived</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold tracking-tight">
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-xs text-muted-foreground">Current balance</p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
            No accounts available yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
