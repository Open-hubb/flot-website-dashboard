import { requireAdmin } from "@/lib/admin-auth"
import Link from "next/link"
import { AdminSignOut } from "../admin-sign-out"

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-bold">flot</span>
            <span className="text-lg font-bold text-primary">.</span>
            <span className="ml-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/merchants"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Merchants
            </Link>
          </nav>
        </div>
        <AdminSignOut />
      </header>
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
