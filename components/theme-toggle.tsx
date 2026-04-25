"use client"

import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div className="inline-flex items-center rounded-md border bg-background p-1 shadow-sm">
      <Button
        type="button"
        variant={isDark ? "ghost" : "secondary"}
        size="icon-sm"
        className="rounded-sm"
        onClick={() => setTheme("light")}
        aria-label="Switch to light theme"
        aria-pressed={!isDark}
      >
        <SunIcon />
      </Button>
      <Button
        type="button"
        variant={isDark ? "secondary" : "ghost"}
        size="icon-sm"
        className="rounded-sm"
        onClick={() => setTheme("dark")}
        aria-label="Switch to dark theme"
        aria-pressed={isDark}
      >
        <MoonIcon />
      </Button>
    </div>
  )
}