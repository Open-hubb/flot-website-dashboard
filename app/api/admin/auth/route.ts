import { NextRequest, NextResponse } from "next/server"
import { getAdminCookieValue, ADMIN_COOKIE } from "@/lib/admin-auth"

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))

  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 500 })
  }

  if (password !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, getAdminCookieValue(), COOKIE_OPTS)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 })
  return res
}
