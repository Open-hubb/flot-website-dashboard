import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { db } from "@/lib/db"
import { headers } from "next/headers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true, businessName: true, name: true, disabledTabs: true, menuContent: { select: { id: true } } },
  })

  if (!merchant) redirect("/login")

  const isMenu = !!merchant.menuContent

  const unreadCount = await db.inAppNotification.count({
    where: { merchantId: session.user.id, read: false },
  })

  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""
  const pageTitle = getPageTitle(pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar merchantType={merchant.type} businessName={merchant.businessName} isMenu={isMenu} disabledTabs={merchant.disabledTabs} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={pageTitle}
          merchantName={merchant.name}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/": "Overview",
    "/transactions": "Transactions",
    "/analytics": "Analytics",
    "/qr-code": "QR Code",
    "/payouts": "Payouts",
    "/customers": "Customers",
    "/orders": "Orders",
    "/products": "Products",
    "/menu": "Menu",
    "/cms": "Website CMS",
    "/cms/media": "Media Library",
    "/website-analytics": "Website Analytics",
    "/notifications": "Notifications",
    "/settings": "Settings",
  }
  if (map[pathname]) return map[pathname]
  if (pathname.startsWith("/cms/") && pathname !== "/cms/media") return "Edit Page"
  return "Dashboard"
}
