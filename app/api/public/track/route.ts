import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

const bodySchema = z.object({
  merchantId: z.string().trim().min(1).max(100),
  page: z.string().trim().min(1).max(500),
  referrer: z.string().max(500).nullable().optional(),
})

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "merchantId and page are required" }, { status: 400, headers: CORS })
  }
  const { merchantId, page, referrer } = parsed.data

  const merchant = await db.merchant.findUnique({
    where: { flotMerchantId: merchantId },
    select: { id: true, type: true },
  })

  if (!merchant || merchant.type !== "WEBSITE") {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS })
  }

  await db.websiteAnalyticsEvent.create({
    data: {
      merchantId: merchant.id,
      page,
      referrer: referrer || null,
    },
  })

  return NextResponse.json({ ok: true }, { headers: CORS })
}
