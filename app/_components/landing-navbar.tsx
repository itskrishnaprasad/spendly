import Link from "next/link"

import { Button } from "@/components/ui/button"

export function LandingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <nav
        className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          aria-label="Spendly home"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            S
          </span>
          spendly
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="text-sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
