"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  Users,
  ShoppingBag,
  Package,
  Layers,
  Globe,
  Bell,
  Settings,
  LogOut,
  UtensilsCrossed,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  websiteOnly?: boolean
  qrOnly?: boolean
  menuOnly?: boolean    // only for menu (restaurant) sites
  hideForMenu?: boolean // hide for menu sites (e.g. the generic site CMS)
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
{ label: "Payouts", href: "/payouts", icon: Wallet },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Orders", href: "/orders", icon: ShoppingBag, websiteOnly: true },
  { label: "Menu", href: "/menu", icon: UtensilsCrossed, websiteOnly: true, menuOnly: true },
  { label: "Products", href: "/products", icon: Package, websiteOnly: true, hideForMenu: true },
  { label: "CMS", href: "/cms", icon: Layers, websiteOnly: true, hideForMenu: true },
  { label: "Web Analytics", href: "/website-analytics", icon: Globe, websiteOnly: true },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  merchantType: "QR_ONLY" | "WEBSITE"
  businessName: string
  isMenu?: boolean
}

export function Sidebar({ merchantType, businessName, isMenu = false }: SidebarProps) {
  const pathname = usePathname()
  const isWebsite = merchantType === "WEBSITE"

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.websiteOnly && !isWebsite) return false
    if (item.qrOnly && isWebsite) return false
    if (item.menuOnly && !isMenu) return false
    if (item.hideForMenu && isMenu) return false
    return true
  })

  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <span className="text-xl font-bold tracking-tight text-white">flot</span>
        <span className="ml-1 text-xl font-bold text-primary">.</span>
      </div>

      {/* Business name */}
      <div className="px-6 py-4 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">Merchant</p>
        <p className="mt-0.5 text-sm font-medium truncate">{businessName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
