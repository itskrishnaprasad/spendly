import {
  ArrowRightIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function LandingHero() {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-28 pb-10 text-center sm:px-6">
      {/* Glow blob — decorative, aria-hidden */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[420px] w-full max-w-3xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />
      </div>

      <Badge
        variant="secondary"
        className="mb-5 gap-1.5 px-3 py-1 text-xs font-medium"
      >
        <ZapIcon className="size-3 text-primary" />
        Personal finance, reimagined
      </Badge>

      <h1 className="mx-auto max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
        Manage your money with{" "}
        <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          clarity
        </span>{" "}
        and automation
      </h1>

      <p className="mx-auto mt-5 max-w-md text-balance text-sm text-muted-foreground sm:text-base">
        Spendly gives you a clear picture of your income, expenses, budgets, and
        recurring transactions — all in one minimal dashboard.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="gap-2 text-sm">
          <Link href="/sign-up">
            Get started free
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="text-sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>

      <ul
        className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
        aria-label="Product highlights"
      >
        {[
          { icon: ShieldCheckIcon, label: "No credit card required" },
          { icon: TrendingUpIcon, label: "Smart budget tracking" },
          { icon: ZapIcon, label: "Recurring automation" },
        ].map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-1.5">
            <Icon className="size-3.5 text-primary" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  )
}
