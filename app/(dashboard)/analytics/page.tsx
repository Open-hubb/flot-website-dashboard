import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/format"
import { StatCard } from "@/components/dashboard/stat-card"
import { AnalyticsChart, OrdersChart } from "@/components/charts/analytics-chart"
import { TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react"
import { subDays, format } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

const PERIODS = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
] as const

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const days = parseInt(searchParams.period ?? "30")
  const validDays = [7, 30, 90].includes(days) ? days : 30
  const since = subDays(new Date(), validDays)

  const [orders, allTime] = await Promise.all([
    db.order.findMany({
      where: { merchantId: session.user.id, receivedAt: { gte: since } },
      select: { amount: true, currency: true, status: true, receivedAt: true },
      orderBy: { receivedAt: "asc" },
    }),
    db.order.aggregate({
      where: { merchantId: session.user.id, status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  // Build daily buckets
  const dayMap = new Map<string, { revenue: number; completed: number; pending: number; failed: number }>()
  for (let i = validDays - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), validDays <= 30 ? "MMM d" : "MMM d")
    dayMap.set(d, { revenue: 0, completed: 0, pending: 0, failed: 0 })
  }
  for (const o of orders) {
    const d = format(o.receivedAt, "MMM d")
    const bucket = dayMap.get(d)
    if (!bucket) continue
    if (o.status === "COMPLETED") bucket.revenue += Number(o.amount ?? 0)
    bucket[o.status.toLowerCase() as "completed" | "pending" | "failed"]++
  }

  const chartData = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }))
  const ordersChartData = chartData.map(({ date, completed, pending, failed }) => ({
    date, completed, pending, failed,
  }))

  const periodCompleted = orders.filter((o) => o.status === "COMPLETED").length
  const periodPending = orders.filter((o) => o.status === "PENDING").length
  const periodFailed = orders.filter((o) => o.status === "FAILED").length

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/analytics?period=${p.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              String(validDays) === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title={`Completed (${validDays}d)`}
          value={periodCompleted.toString()}
          subtitle="Successful payments"
          icon={TrendingUp}
        />
        <StatCard
          title="Completed"
          value={periodCompleted.toString()}
          subtitle="Successful orders"
          icon={CheckCircle}
        />
        <StatCard
          title="Pending"
          value={periodPending.toString()}
          subtitle="Awaiting payment"
          icon={Clock}
        />
        <StatCard
          title="Failed"
          value={periodFailed.toString()}
          subtitle="Unsuccessful"
          icon={XCircle}
        />
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold">Revenue Trend</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Daily completed payment volume over the last {validDays} days
        </p>
        <AnalyticsChart data={chartData} />
      </div>

      {/* Orders breakdown chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold">Order Breakdown</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Daily orders by status over the last {validDays} days
        </p>
        <OrdersChart data={ordersChartData} />
      </div>

      {/* All-time summary */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">All-Time Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Completed Orders</p>
            <p className="mt-1 text-2xl font-bold">{allTime._count}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
