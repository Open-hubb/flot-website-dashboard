import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { productSchema } from "@/lib/cms-validation"
import { NextRequest, NextResponse } from "next/server"

// Update a product — scoped: only the owning merchant can touch it.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const existing = await db.product.findFirst({
    where: { id: params.id, merchantId: session.user.id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const d = parsed.data
  const product = await db.product.update({
    where: { id: existing.id },
    data: {
      name: d.name,
      price: d.price,
      currency: d.currency || "SLE",
      image: d.image || null,
      category: d.category || null,
      description: d.description || null,
      badge: d.badge || null,
      order: d.order ?? 0,
      active: d.active ?? true,
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // deleteMany with the merchantId guard ensures one merchant can't delete another's product.
  const result = await db.product.deleteMany({
    where: { id: params.id, merchantId: session.user.id },
  })
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
