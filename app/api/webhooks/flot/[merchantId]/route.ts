import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Resend } from "resend"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { safeEqual } from "@/lib/crypto"
import { APP_URL } from "@/lib/app-url"

const payloadSchema = z.object({
  orderId: z.string(),
  flotRequestId: z.string(),
  status: z.enum(["completed", "failed"]),
  // Optional — Flot's current payload omits these, but capture them if/when
  // it starts sending the amount so transactions show a value.
  amount: z.union([z.string(), z.number()]).optional(),
  currency: z.string().optional(),
})

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export async function POST(
  req: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  const merchant = await db.merchant.findUnique({
    where: { flotMerchantId: params.merchantId },
    select: { id: true, email: true, name: true, businessName: true, type: true, webhookUsername: true, webhookPassword: true },
  })

  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Verify Basic Auth sent by Flot backend. Fail CLOSED: if credentials
  // aren't configured for this merchant, reject — never accept unauthenticated
  // payment events (which would let anyone forge "completed" orders).
  if (!merchant.webhookUsername || !merchant.webhookPassword) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 401 })
  }
  const authHeader = req.headers.get("authorization") ?? ""
  const expected = `Basic ${Buffer.from(`${merchant.webhookUsername}:${merchant.webhookPassword}`).toString("base64")}`
  if (!safeEqual(authHeader, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  // Temporary: log the raw incoming payload so we can confirm Flot's exact
  // shape on the first live webhook. Safe to remove once verified.
  console.log("[flot-webhook]", params.merchantId, "payload:", JSON.stringify(body))
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    console.warn("[flot-webhook] payload REJECTED (shape mismatch):", JSON.stringify(body))
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { orderId, flotRequestId, status, amount, currency } = parsed.data
  const amountNum =
    amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : undefined
  let completionRecorded = false
  let customerOrderLinked = false

  if (status === "completed") {
    const completedData = {
      status: "COMPLETED" as const,
      ...(amountNum != null ? { amount: amountNum } : {}),
      ...(currency ? { currency } : {}),
    }

    const updated = await db.order.updateMany({
      where: {
        flotRequestId,
        merchantId: merchant.id,
        status: { not: "COMPLETED" },
      },
      data: completedData,
    })
    if (updated.count > 0) {
      completionRecorded = true
    } else {
      try {
        await db.order.create({
          data: {
            merchantId: merchant.id,
            orderId,
            flotRequestId,
            ...completedData,
            rawPayload: body,
          },
        })
        completionRecorded = true
      } catch (error) {
        // A simultaneous delivery may create this globally unique request ID
        // first. Treat that as an already-recorded event without querying an
        // aborted transaction or modifying another merchant's payment.
        if (!isUniqueViolation(error)) throw error
      }
    }

    customerOrderLinked = await db.$transaction(async (tx) => {
      // Flot returns the merchant's original order ID. Only mark the customer
      // order paid when that ID matches exactly; a time-window match can
      // otherwise assign one customer's payment to another customer's order.
      const linkedCustomerOrder = await db.customerOrder.updateMany({
        where: {
          merchantId: merchant.id,
          id: orderId,
          flotRequestId: null,
          status: "PENDING",
        },
        data: {
          flotRequestId,
          status: "PAID",
        },
      })
      if (linkedCustomerOrder.count === 1) {
        await db.customerOrderEvent.create({
          data: {
            customerOrderId: orderId,
            fromStatus: "PENDING",
            toStatus: "PAID",
            changedBy: "flot-webhook",
            note: "Payment confirmed by Flot",
          },
        })
      }
      return linkedCustomerOrder.count === 1
    })
  } else {
    // Failed payments remain pending so the customer can retry, but a late
    // failed delivery must never overwrite an already completed payment.
    const updated = await db.order.updateMany({
      where: {
        flotRequestId,
        merchantId: merchant.id,
        status: { not: "COMPLETED" },
      },
      data: { status: "PENDING" },
    })
    if (updated.count === 0) {
      try {
        await db.order.create({
          data: {
            merchantId: merchant.id,
            orderId,
            flotRequestId,
            status: "PENDING",
            rawPayload: body,
          },
        })
      } catch (error) {
        if (!isUniqueViolation(error)) throw error
      }
    }
  }

  if (completionRecorded) {
    const amountDisplay = ""

    await db.inAppNotification.create({
      data: {
        merchantId: merchant.id,
        type: "ORDER_COMPLETED",
        title: customerOrderLinked || merchant.type !== "WEBSITE" ? "Payment received" : "Payment needs order review",
        body: customerOrderLinked || merchant.type !== "WEBSITE"
          ? `Order #${orderId}${amountDisplay ? ` · ${amountDisplay}` : ""} has been paid successfully.`
          : `Payment #${orderId} was received but could not be matched to a website order. Review it before fulfillment.`,
      },
    })

    const prefs = await db.notificationPrefs.findUnique({
      where: { merchantId: merchant.id },
    })

    if (prefs?.newOrderAlert !== false) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.FROM_EMAIL ?? "Flot <noreply@flotme.ai>",
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
              <a href="${APP_URL}/transactions"
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
