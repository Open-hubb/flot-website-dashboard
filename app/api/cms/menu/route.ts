import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { menuContentSchema, withMenuDefaults } from "@/lib/menu-content"
import { NextRequest, NextResponse } from "next/server"

// The logged-in merchant's menu (always returns a full shape).
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const row = await db.menuContent.findUnique({ where: { merchantId: session.user.id } })
  return NextResponse.json(withMenuDefaults(row?.content))
}

// Save the logged-in merchant's menu (upsert, scoped to them).
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = menuContentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid menu", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  // Stamp version + lastModified so sites can cache-bust.
  const content = {
    ...parsed.data,
    version: (parsed.data.version || 0) + 1,
    lastModified: new Date().toISOString(),
  }
  await db.menuContent.upsert({
    where: { merchantId: session.user.id },
    update: { content },
    create: { merchantId: session.user.id, content },
  })
  return NextResponse.json({ ok: true, version: content.version })
}
