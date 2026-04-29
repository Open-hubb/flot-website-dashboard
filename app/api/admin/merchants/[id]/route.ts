import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAdminCookieValue, ADMIN_COOKIE } from "@/lib/admin-auth"

function isAdmin(req: NextRequest) {
  return req.cookies.get(ADMIN_COOKIE)?.value === getAdminCookieValue()
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.merchant.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
