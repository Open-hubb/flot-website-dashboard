import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { timeAgo } from "@/lib/format"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markAllRead, markOneRead } from "./actions"
import { cn } from "@/lib/utils"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const notifications = await db.inAppNotification.findMany({
    where: { merchantId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <Button type="submit" variant="outline" size="sm">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          </form>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start justify-between gap-4 px-6 py-4",
                !n.read && "bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3">
                {!n.read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
                {n.read && <span className="mt-2 h-2 w-2 shrink-0" />}
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
              {!n.read && (
                <form action={markOneRead.bind(null, n.id)}>
                  <Button type="submit" variant="ghost" size="sm" className="text-xs shrink-0">
                    Mark read
                  </Button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
