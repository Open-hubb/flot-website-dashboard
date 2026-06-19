import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { siteContentSchema, withDefaults } from "@/lib/site-content"
import { NextRequest, NextResponse } from "next/server"

// The logged-in merchant's site content (always returns a full shape).
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const row = await db.siteContent.findUnique({ where: { merchantId: session.user.id } })
  return NextResponse.json(withDefaults(row?.content))
}

// Save the logged-in merchant's site content (upsert, scoped to them).
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = siteContentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid content", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  await db.siteContent.upsert({
    where: { merchantId: session.user.id },
    update: { content: parsed.data },
    create: { merchantId: session.user.id, content: parsed.data },
  })
  return NextResponse.json({ ok: true })
}
