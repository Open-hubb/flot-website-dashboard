import { cn } from "@/lib/utils"

/**
 * Flot brand logo — the official F-tile mark (public/flotlogo.png, transparent
 * rounded corners) plus the Satoshi wordmark. `variant` sets the wordmark
 * colour for the surface it sits on (dark sidebar vs light page).
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
  const dim = size === "lg" ? 44 : 32
  const word = size === "lg" ? "text-3xl" : "text-xl"
  const wordColor = variant === "dark" ? "text-white" : "text-[#2a2a2a]"

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/flotlogo.png" alt="Flot" width={dim} height={dim} className="shrink-0" />
      {showWordmark && (
        <span className={cn("font-display font-bold leading-none tracking-tight", word, wordColor)}>
          Flot
        </span>
      )}
    </div>
  )
}
