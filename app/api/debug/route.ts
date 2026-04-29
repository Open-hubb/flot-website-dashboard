import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const count = await db.merchant.count()
  const merchants = await db.merchant.findMany({
    select: { email: true, type: true, businessName: true },
  })
  return NextResponse.json({ count, merchants })
}
