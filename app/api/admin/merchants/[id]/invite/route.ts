import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendInviteEmail } from "@/lib/invite"
import { getAdminCookieValue, ADMIN_COOKIE } from "@/lib/admin-auth"
import { randomBytes } from "crypto"

function isAdmin(req: NextRequest) {
  return req.cookies.get(ADMIN_COOKIE)?.value === getAdminCookieValue()
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const merchant = await db.merchant.findUnique({ where: { id: params.id } })
  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const inviteToken = randomBytes(32).toString("hex")
  const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.merchant.update({
    where: { id: params.id },
    data: { inviteToken, inviteExpiry },
  })

  try {
    await sendInviteEmail({
      email: merchant.email,
      name: merchant.name,
      businessName: merchant.businessName,
      token: inviteToken,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Email send failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
