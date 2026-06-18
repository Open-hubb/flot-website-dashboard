import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { productSchema } from "@/lib/cms-validation"
import { NextRequest, NextResponse } from "next/server"

// List the logged-in merchant's products (scoped to their merchantId).
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const products = await db.product.findMany({
    where: { merchantId: session.user.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json(products)
}

// Create a product for the logged-in merchant.
export async function POST(req: NextRequest) {
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
  const d = parsed.data
  const product = await db.product.create({
    data: {
      merchantId: session.user.id,
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
