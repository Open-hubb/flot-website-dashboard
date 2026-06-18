import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}

// PUBLIC: a merchant's active products, by their Flot Merchant ID.
// Merchant websites fetch this to render their catalogue.
export async function GET(
  _req: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  const merchant = await db.merchant.findUnique({
    where: { flotMerchantId: params.merchantId },
    select: { id: true },
  })
  if (!merchant) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS })
  }

  const products = await db.product.findMany({
    where: { merchantId: merchant.id, active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      price: true,
      currency: true,
      image: true,
      category: true,
      description: true,
      badge: true,
    },
  })

  // Cast Decimal -> number for clean JSON.
  const out = products.map((p) => ({ ...p, price: Number(p.price) }))
  return NextResponse.json(out, { headers: CORS })
}
