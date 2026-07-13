import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"

// Inter — operational fallback: body, forms, email (per the Flot brand guide).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

// JetBrains Mono — code, IDs, transaction references / amounts.
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

// Satoshi — the Flot brand family: logo, headlines, subheads.
const satoshi = localFont({
  src: [
    { path: "../public/fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Satoshi-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Flot Merchant Dashboard",
  description: "Manage your Flot merchant account",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans antialiased", inter.variable, jetbrains.variable, satoshi.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
