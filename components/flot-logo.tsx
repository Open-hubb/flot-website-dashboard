import { cn } from "@/lib/utils"

/**
 * Flot brand mark — a rounded graphite tile with the mint "F", plus the
 * Satoshi wordmark. `variant="dark"` inverts (mint tile) for dark surfaces
 * like the sidebar; `variant="light"` is the native app-icon look.
 */
export function FlotLogo({
  size = "md",
  variant = "light",
  showWordmark = true,
  className,
}: {
  size?: "md" | "lg"
  variant?: "light" | "dark"
  showWordmark?: boolean
  className?: string
}) {
  const tile =
    size === "lg" ? "h-11 w-11 rounded-xl text-2xl" : "h-8 w-8 rounded-[10px] text-lg"
  const word = size === "lg" ? "text-3xl" : "text-xl"
  const tileColors =
    variant === "dark" ? "bg-primary text-[#1a1a1a]" : "bg-[#2a2a2a] text-primary"
  const wordColor = variant === "dark" ? "text-white" : "text-[#2a2a2a]"

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center font-display font-black leading-none",
          tile,
          tileColors
        )}
        aria-hidden
      >
        F
      </span>
      {showWordmark && (
        <span className={cn("font-display font-bold leading-none tracking-tight", word, wordColor)}>
          Flot
        </span>
      )}
    </div>
  )
}
