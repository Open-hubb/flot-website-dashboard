import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { canTransition, ALL_STATUSES } from "@/lib/order-transitions"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  status: z.enum(ALL_STATUSES as [string, ...string[]]),
  note: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }
  const nextStatus = parsed.data.status as (typeof ALL_STATUSES)[number]
  const note = parsed.data.note?.trim() || null

  // Scope to this merchant — never trust the id alone.
  const order = await db.customerOrder.findFirst({
    where: { id: params.id, merchantId: session.user.id },
    select: { id: true, status: true },
  })
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.status === nextStatus) {
    return NextResponse.json({ ok: true, already: true })
  }

  if (!canTransition(order.status, nextStatus)) {
    return NextResponse.json(
      { error: `Cannot move an order from ${order.status} to ${nextStatus}.` },
      { status: 409 }
    )
  }

  await db.$transaction([
    db.customerOrder.update({ where: { id: order.id }, data: { status: nextStatus } }),
    db.customerOrderEvent.create({
      data: {
        customerOrderId: order.id,
        fromStatus: order.status,
        toStatus: nextStatus,
        changedBy: session.user.email ?? "merchant",
        note,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
