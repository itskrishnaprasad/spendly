import type { Metadata } from "next"

import { LandingNavbar } from "@/app/_components/landing-navbar"
import { LandingHero } from "@/app/_components/landing-hero"
import { DashboardPreview } from "@/app/_components/dashboard-preview"

export const metadata: Metadata = {
  title: "Spendly — Modern Personal Finance",
  description:
    "Manage your income, expenses, budgets, and recurring transactions with clarity and automation. The modern personal finance dashboard for professionals.",
}

export default function HomePage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-x-hidden bg-background">
      {/* Subtle radial grid overlay — decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]"
      />

      <LandingNavbar />

      <main id="main-content" className="flex flex-1 flex-col">
        <LandingHero />
        <DashboardPreview />
      </main>
    </div>
  )
}
