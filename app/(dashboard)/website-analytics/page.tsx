import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Lock, Globe, Eye, TrendingUp } from "lucide-react"
import { subDays, format } from "date-fns"
import { RevenueChart } from "@/components/charts/revenue-chart"

export default async function WebsiteAnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true },
  })

  if (merchant?.type !== "WEBSITE") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="mb-4 h-10 w-10 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-semibold">Website merchants only</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Website analytics are available for merchants with a Flot-integrated website.
        </p>
      </div>
    )
  }

  const rawDays = parseInt(searchParams.period ?? "30")
  const days = [7, 30, 90].includes(rawDays) ? rawDays : 30
  const since = subDays(new Date(), days)

  const [totalViews, periodViews, recentEvents, topPages] = await Promise.all([
    db.websiteAnalyticsEvent.count({ where: { merchantId: session.user.id } }),
    db.websiteAnalyticsEvent.count({
      where: { merchantId: session.user.id, createdAt: { gte: since } },
    }),
    db.websiteAnalyticsEvent.findMany({
      where: { merchantId: session.user.id, createdAt: { gte: since } },
      select: { page: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.websiteAnalyticsEvent.groupBy({
      by: ["page"],
      where: { merchantId: session.user.id, createdAt: { gte: since } },
      _count: { page: true },
      orderBy: { _count: { page: "desc" } },
      take: 10,
    }),
  ])

  // Build daily chart data
  const dayMap = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    dayMap.set(format(subDays(new Date(), i), "MMM d"), 0)
  }
  for (const ev of recentEvents) {
    const d = format(ev.createdAt, "MMM d")
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1)
  }
  const chartData = Array.from(dayMap.entries()).map(([date, amount]) => ({ date, amount }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Page Views ({days}d)</p>
              <p className="text-2xl font-bold">{periodViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">All-Time Views</p>
              <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. per Day</p>
              <p className="text-2xl font-bold">
                {days > 0 ? (periodViews / days).toFixed(1) : "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page views chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold">Page Views Trend</h2>
        <p className="mb-4 text-sm text-muted-foreground">Daily page views over the last {days} days</p>
        <RevenueChart data={chartData} />
      </div>

      {/* Top pages */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Top Pages</h2>
        </div>
        <div className="divide-y">
          {topPages.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No page view data yet. Make sure your website is sending analytics events to{" "}
              <code className="text-xs">/api/public/track</code>.
            </p>
          ) : (
            topPages.map((p) => (
              <div key={p.page} className="flex items-center justify-between px-6 py-3">
                <p className="text-sm font-mono text-muted-foreground truncate max-w-[300px]">
                  {p.page}
                </p>
                <p className="text-sm font-semibold">{p._count.page.toLocaleString()} views</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Integration snippet */}
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-3">
        <div>
          <p className="font-semibold">Add tracking to your website</p>
          <p className="text-sm text-muted-foreground mt-1">
            Paste this single line into the <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;head&gt;</code> of every page on your website. No other setup needed.
          </p>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted px-4 py-3 text-xs leading-relaxed">
{`<script src="https://flot-dashboard.vercel.app/api/public/tracker.js?id=${session.user.flotMerchantId}" async></script>`}
        </pre>
        <p className="text-xs text-muted-foreground">
          Page views and referrers will appear in this dashboard within seconds of each visit.
        </p>
      </div>
    </div>
  )
}
