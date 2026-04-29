import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { Users, TrendingUp, RepeatIcon } from "lucide-react"
import { subDays } from "date-fns"

export default async function CustomersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const thirtyDaysAgo = subDays(new Date(), 30)

  const [totalCompleted, recentCompleted, repeatOrders] = await Promise.all([
    db.order.count({ where: { merchantId: session.user.id, status: "COMPLETED" } }),
    db.order.count({
      where: {
        merchantId: session.user.id,
        status: "COMPLETED",
        receivedAt: { gte: thirtyDaysAgo },
      },
    }),
    db.order.count({ where: { merchantId: session.user.id, status: "COMPLETED" } }),
  ])

  const recentOrders = await db.order.findMany({
    where: { merchantId: session.user.id, status: "COMPLETED" },
    orderBy: { receivedAt: "desc" },
    take: 20,
    select: { orderId: true, amount: true, currency: true, receivedAt: true, paymentType: true },
  })

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold">{totalCompleted}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last 30 Days</p>
              <p className="text-2xl font-bold">{recentCompleted}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <RepeatIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. per Day</p>
              <p className="text-2xl font-bold">
                {recentCompleted > 0 ? (recentCompleted / 30).toFixed(1) : "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        Customer identities are not included in Flot webhook data. Contact your Flot account
        manager if you need customer-level reporting.
      </div>

      {/* Recent payments table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Recent Completed Payments</h2>
        </div>
        <div className="divide-y">
          {recentOrders.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No completed payments yet.
            </p>
          ) : (
            recentOrders.map((order) => (
              <div key={order.orderId} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium font-mono">{order.orderId}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(order.receivedAt)} · {order.paymentType ?? "QR"}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {order.amount
                    ? formatCurrency(Number(order.amount), order.currency ?? "SLE")
                    : "—"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
