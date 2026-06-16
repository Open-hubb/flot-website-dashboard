import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { randomBytes } from "crypto"

function makeReference(businessName: string): string {
  const prefix = (businessName.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "ORD")
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  const rand = randomBytes(3).toString("hex").toUpperCase()
  return `${prefix}-${ymd}-${rand}`
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

const bodySchema = z.object({
  merchantId: z.string(),
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  items: z.array(
    z.object({
      name: z.string(),
      size: z.string(),
      qty: z.number().int().positive(),
      price: z.number().nonnegative(),
    })
  ).min(1),
  total: z.number().positive(),
  currency: z.string().default("NLE"),
})

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: CORS })
  }

  const { merchantId, name, phone, address, city, items, total, currency } = parsed.data

  const merchant = await db.merchant.findUnique({
    where: { flotMerchantId: merchantId },
    select: { id: true, type: true, businessName: true },
  })

  if (!merchant || merchant.type !== "WEBSITE") {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: CORS })
  }

  const customerOrder = await db.customerOrder.create({
    data: {
      merchantId: merchant.id,
      reference: makeReference(merchant.businessName),
      name,
      phone,
      address,
      city,
      items,
      total,
      currency,
      events: {
        create: {
          fromStatus: null,
          toStatus: "PENDING",
          changedBy: "system",
          note: "Order placed on website",
        },
      },
    },
  })

  return NextResponse.json({ ok: true, orderId: customerOrder.id }, { status: 201, headers: CORS })
}
