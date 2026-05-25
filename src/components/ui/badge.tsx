import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // TAA semantic palette — opt-in. Inline color values bypass the
        // global remap (amber/orange → brand red) so warning actually
        // reads as warning instead of merging with the brand.
        success:
          "border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        warning:
          "border-transparent bg-[#FFF7ED] text-[#9A3412] hover:bg-[#FFEDD5]",
        info:
          "border-transparent bg-sky-50 text-sky-700 hover:bg-sky-100",
        neutral:
          "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
        // Brand-tinted soft pill — for "Boosted", "Featured", etc.
        keedaSoft:
          "border-transparent bg-brand-50 text-brand-700 hover:bg-brand-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
