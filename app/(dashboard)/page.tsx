import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { StatCard } from "@/components/dashboard/stat-card"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { ArrowLeftRight, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { subDays, startOfDay, format } from "date-fns"
import { Badge } from "@/components/ui/badge"

async function getOverviewData(merchantId: string) {
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const sixtyDaysAgo = subDays(now, 60)

  const [allOrders, recentOrders, lastPeriodOrders, last30DaysOrders] = await Promise.all([
    db.order.aggregate({
      where: { merchantId, status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
    }),
    db.order.findMany({
      where: { merchantId },
      orderBy: { receivedAt: "desc" },
      take: 6,
    }),
    db.order.aggregate({
      where: {
        merchantId,
        status: "COMPLETED",
        receivedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      _sum: { amount: true },
    }),
    db.order.findMany({
      where: {
        merchantId,
        status: "COMPLETED",
        receivedAt: { gte: thirtyDaysAgo },
      },
      select: { amount: true, currency: true, receivedAt: true },
    }),
  ])

  // Build chart data grouped by day
  const chartMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const day = format(subDays(now, i), "MMM d")
    chartMap.set(day, 0)
  }
  for (const order of last30DaysOrders) {
    const day = format(order.receivedAt, "MMM d")
    chartMap.set(day, (chartMap.get(day) ?? 0) + Number(order.amount ?? 0))
  }
  const chartData = Array.from(chartMap.entries()).map(([date, amount]) => ({ date, amount }))

  const currentRevenue = Number(allOrders._sum.amount ?? 0)
  const lastRevenue = Number(lastPeriodOrders._sum.amount ?? 0)
  const trendPct =
    lastRevenue > 0 ? (((currentRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1) : null

  return { allOrders, recentOrders, chartData, trendPct, currentRevenue }
}

export default async function OverviewPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { allOrders, recentOrders, chartData, trendPct, currentRevenue } =
    await getOverviewData(session.user.id)

  const pendingCount = await db.order.count({
    where: { merchantId: session.user.id, status: "PENDING" },
  })

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(currentRevenue)}
          subtitle="All completed payments"
          icon={TrendingUp}
          trend={trendPct ? { value: `${trendPct}%`, positive: Number(trendPct) >= 0 } : undefined}
        />
        <StatCard
          title="Total Orders"
          value={allOrders._count.toString()}
          subtitle="Completed transactions"
          icon={CheckCircle}
        />
        <StatCard
          title="Pending"
          value={pendingCount.toString()}
          subtitle="Awaiting payment"
          icon={Clock}
        />
        <StatCard
          title="Transactions"
          value={allOrders._count.toString()}
          subtitle="Via Flot Checkout"
          icon={ArrowLeftRight}
        />
      </div>

      {/* Chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold">Revenue (Last 30 days)</h2>
        <p className="mb-4 text-sm text-muted-foreground">Daily completed payments</p>
        <RevenueChart data={chartData} />
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Recent Transactions</h2>
        </div>
        <div className="divide-y">
          {recentOrders.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No transactions yet. Payments will appear here once received.
            </p>
          )}
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between px-6 py-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Order #{order.orderId}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(order.receivedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                {order.amount && (
                  <span className="text-sm font-semibold">
                    {formatCurrency(Number(order.amount), order.currency ?? "SLE")}
                  </span>
                )}
                <Badge
                  variant={
                    order.status === "COMPLETED"
                      ? "default"
                      : order.status === "FAILED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {order.status.toLowerCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
