import { db } from "@/lib/db"
import { withDefaults } from "@/lib/site-content"
import { NextRequest, NextResponse } from "next/server"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}

// PUBLIC: a merchant's site content by Flot Merchant ID. The website fetches
// this to render its hero/about/services/etc.
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
  const row = await db.siteContent.findUnique({ where: { merchantId: merchant.id } })
  return NextResponse.json(withDefaults(row?.content), { headers: CORS })
}
