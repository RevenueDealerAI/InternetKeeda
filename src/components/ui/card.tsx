import * as React from "react"

import { cn } from "@/lib/utils"

// TAA-aesthetic surface presets — opt-in via the `surface` prop on Card.
// Existing consumers don't pass a surface and get the legacy look.
const cardSurface = {
  default: "rounded-lg border bg-card text-card-foreground shadow-sm",
  // Clean: white, slate-200 hairline, soft shadow, generous radius.
  // Use this for admin panels, dashboard tiles, and the new content cards.
  clean:
    "rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-shadow duration-200 ease-out hover:shadow-md",
  // Inset: subtle gray surface for KPI tiles and metric panels.
  inset:
    "rounded-xl border border-slate-200 bg-slate-50 text-slate-900",
  // Outline-only: no fill, slate-200 ring. For empty states and dropzones.
  outline:
    "rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-600",
} as const

export type CardSurface = keyof typeof cardSurface

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, surface, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardSurface[surface ?? "default"], className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
