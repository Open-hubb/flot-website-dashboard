import { db } from "@/lib/db"
import { withMenuDefaults } from "@/lib/menu-content"
import { NextRequest, NextResponse } from "next/server"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}

// PUBLIC: a merchant's menu by Flot Merchant ID. The menu site fetches this to
// render its branding/groups/sections/items.
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
  const row = await db.menuContent.findUnique({ where: { merchantId: merchant.id } })
  if (!row) {
    return NextResponse.json({ error: "No menu" }, { status: 404, headers: CORS })
  }
  return NextResponse.json(withMenuDefaults(row.content), {
    headers: { ...CORS, "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  })
}
