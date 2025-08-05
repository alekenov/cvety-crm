import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width variant for the form container
   * @default "4xl"
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full"
  /**
   * Whether to include padding
   * @default true
   */
  withPadding?: boolean
}

const maxWidthVariants = {
  sm: "max-w-sm",     // 384px (24rem)
  md: "max-w-md",     // 448px (28rem)
  lg: "max-w-lg",     // 512px (32rem)
  xl: "max-w-xl",     // 576px (36rem)
  "2xl": "max-w-2xl", // 672px (42rem)
  "3xl": "max-w-3xl", // 768px (48rem)
  "4xl": "max-w-4xl", // 896px (56rem)
  "5xl": "max-w-5xl", // 1024px (64rem)
  "6xl": "max-w-6xl", // 1152px (72rem)
  "7xl": "max-w-7xl", // 1280px (80rem)
  full: "max-w-full",
}

/**
 * FormShell provides a consistent container for forms with automatic width constraints
 * 
 * @example
 * <FormShell maxWidth="2xl">
 *   <form>
 *     Your form fields
 *   </form>
 * </FormShell>
 */
export function FormShell({
  className,
  maxWidth = "4xl",
  withPadding = true,
  children,
  ...props
}: FormShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidthVariants[maxWidth],
        withPadding && "px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}