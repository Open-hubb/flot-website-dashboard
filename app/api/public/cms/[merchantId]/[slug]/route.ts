import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: { merchantId: string; slug: string } }
) {
  const { merchantId, slug } = params

  const merchant = await db.merchant.findUnique({
    where: { flotMerchantId: merchantId },
    select: { id: true },
  })

  if (!merchant) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 })
  }

  const page = await db.cmsPage.findUnique({
    where: { merchantId_slug: { merchantId: merchant.id, slug } },
    select: { title: true, slug: true, publishedContent: true, publishedAt: true },
  })

  if (!page || !page.publishedContent) {
    return NextResponse.json({ error: "Page not published" }, { status: 404 })
  }

  const headers = new Headers()
  headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
  headers.set("Access-Control-Allow-Origin", "*")

  return NextResponse.json(
    { title: page.title, slug: page.slug, blocks: page.publishedContent, publishedAt: page.publishedAt },
    { headers }
  )
}
