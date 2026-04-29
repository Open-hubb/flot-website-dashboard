import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
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
    select: { id: true },
  })

  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { orderId, flotRequestId, status } = parsed.data
  const dbStatus = status === "completed" ? "COMPLETED" : "FAILED"

  await db.order.upsert({
    where: { flotRequestId },
    update: { status: dbStatus },
    create: {
      merchantId: merchant.id,
      orderId,
      flotRequestId,
      status: dbStatus,
      rawPayload: body,
    },
  })

  if (status === "completed") {
    await db.inAppNotification.create({
      data: {
        merchantId: merchant.id,
        type: "ORDER_COMPLETED",
        title: "Payment received",
        body: `Order #${orderId} has been paid successfully.`,
      },
    })
  }

  return NextResponse.json({ received: true })
}
