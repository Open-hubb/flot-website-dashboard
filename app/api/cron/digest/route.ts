import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Resend } from "resend"
import { formatCurrency } from "@/lib/format"
import { subDays } from "date-fns"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  // Vercel cron sends Authorization header with CRON_SECRET
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday
  const resend = new Resend(process.env.RESEND_API_KEY)

  const merchants = await db.merchant.findMany({
    include: { notifPrefs: true },
  })

  let sent = 0

  for (const merchant of merchants) {
    const prefs = merchant.notifPrefs
    if (!prefs?.emailDigest) continue

    const isWeekly = prefs.digestFreq === "WEEKLY"
    if (isWeekly && dayOfWeek !== 1) continue // weekly digests send on Monday only

    const since = subDays(today, isWeekly ? 7 : 1)

    const [completed, failed, pending] = await Promise.all([
      db.order.aggregate({
        where: { merchantId: merchant.id, status: "COMPLETED", receivedAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      }),
      db.order.count({
        where: { merchantId: merchant.id, status: "FAILED", receivedAt: { gte: since } },
      }),
      db.order.count({
        where: { merchantId: merchant.id, status: "PENDING" },
      }),
    ])

    if (completed._count === 0 && failed === 0) continue // nothing to report

    const revenue = Number(completed._sum.amount ?? 0)
    const periodLabel = isWeekly ? "last 7 days" : "yesterday"

    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL ?? "Flot <noreply@flotme.ai>",
        to: merchant.email,
        subject: `Your ${isWeekly ? "weekly" : "daily"} Flot summary — ${merchant.businessName}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <div style="margin-bottom:24px">
              <span style="font-size:24px;font-weight:700;color:#111">flot</span><span style="font-size:24px;font-weight:700;color:#80ffdd">.</span>
            </div>
            <h1 style="font-size:18px;font-weight:600;margin:0 0 4px">${isWeekly ? "Weekly" : "Daily"} summary</h1>
            <p style="color:#888;font-size:13px;margin:0 0 24px">${merchant.businessName} · ${periodLabel}</p>
            <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-bottom:24px">
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="color:#888;font-size:13px;padding:6px 0">Revenue</td>
                  <td style="font-size:15px;font-weight:700;text-align:right;color:#111">${formatCurrency(revenue)}</td>
                </tr>
                <tr>
                  <td style="color:#888;font-size:13px;padding:6px 0">Completed payments</td>
                  <td style="font-size:13px;font-weight:600;text-align:right">${completed._count}</td>
                </tr>
                <tr>
                  <td style="color:#888;font-size:13px;padding:6px 0">Failed payments</td>
                  <td style="font-size:13px;font-weight:600;text-align:right">${failed}</td>
                </tr>
                <tr>
                  <td style="color:#888;font-size:13px;padding:6px 0">Pending payments</td>
                  <td style="font-size:13px;font-weight:600;text-align:right">${pending}</td>
                </tr>
              </table>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://flot-dashboard.vercel.app"}/analytics"
               style="display:inline-block;background:#80ffdd;color:#111;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">
              View analytics
            </a>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#bbb;font-size:12px;margin:0">
              Turn off digest emails in your dashboard settings.
            </p>
          </div>
        `,
      })
      sent++
    } catch (_) {
      // Continue sending to other merchants even if one fails
    }
  }

  return NextResponse.json({ sent })
}
