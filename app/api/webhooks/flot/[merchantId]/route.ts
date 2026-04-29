import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Resend } from "resend"
import { z } from "zod"

const payloadSchema = z.object({
  orderId: z.string(),
  flotRequestId: z.string(),
  status: z.enum(["completed", "failed"]),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  const merchant = await db.merchant.findUnique({
    where: { flotMerchantId: params.merchantId },
    select: { id: true, email: true, name: true, businessName: true, webhookUsername: true, webhookPassword: true },
  })

  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Verify Basic Auth sent by Flot backend
  const authHeader = req.headers.get("authorization") ?? ""
  const expected = `Basic ${Buffer.from(`${merchant.webhookUsername}:${merchant.webhookPassword}`).toString("base64")}`
  if (merchant.webhookUsername && authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { orderId, flotRequestId, status } = parsed.data

  if (status === "completed") {
    await db.order.upsert({
      where: { flotRequestId },
      update: { status: "COMPLETED" },
      create: {
        merchantId: merchant.id,
        orderId,
        flotRequestId,
        status: "COMPLETED",
        rawPayload: body,
      },
    })
  } else {
    // failed = customer can retry, leave as PENDING
    await db.order.upsert({
      where: { flotRequestId },
      update: { status: "PENDING" },
      create: {
        merchantId: merchant.id,
        orderId,
        flotRequestId,
        status: "PENDING",
        rawPayload: body,
      },
    })
  }

  if (status === "completed") {
    const amountDisplay = ""

    await db.inAppNotification.create({
      data: {
        merchantId: merchant.id,
        type: "ORDER_COMPLETED",
        title: "Payment received",
        body: `Order #${orderId}${amountDisplay ? ` · ${amountDisplay}` : ""} has been paid successfully.`,
      },
    })

    const prefs = await db.notificationPrefs.findUnique({
      where: { merchantId: merchant.id },
    })

    if (prefs?.newOrderAlert !== false) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: "Flot <noreply@flotme.ai>",
          to: merchant.email,
          subject: `Payment received${amountDisplay ? ` — ${amountDisplay}` : ""}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
              <div style="margin-bottom:24px">
                <span style="font-size:24px;font-weight:700;color:#111">flot</span><span style="font-size:24px;font-weight:700;color:#80ffdd">.</span>
              </div>
              <h1 style="font-size:18px;font-weight:600;margin:0 0 8px">Payment received</h1>
              <p style="color:#555;margin:0 0 24px">
                Hi ${merchant.name}, a payment has been confirmed for <strong>${merchant.businessName}</strong>.
              </p>
              <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse">
                  <tr>
                    <td style="color:#888;font-size:13px;padding:4px 0">Order ID</td>
                    <td style="font-size:13px;font-weight:600;text-align:right">#${orderId}</td>
                  </tr>
                </table>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://flot-dashboard.vercel.app"}/transactions"
                 style="display:inline-block;background:#80ffdd;color:#111;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">
                View transactions
              </a>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="color:#bbb;font-size:12px;margin:0">
                You're receiving this because you have payment alerts enabled. Turn them off in your dashboard settings.
              </p>
            </div>
          `,
        })
      } catch (_) {
        // Non-critical — don't fail the webhook if email fails
      }
    }
  }

  return NextResponse.json({ received: true })
}
