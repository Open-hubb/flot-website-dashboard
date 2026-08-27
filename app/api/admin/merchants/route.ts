import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendInviteEmail } from "@/lib/invite"
import { getAdminCookieValue, ADMIN_COOKIE } from "@/lib/admin-auth"
import { randomBytes } from "crypto"
import { z } from "zod"

function isAdmin(req: NextRequest) {
  return req.cookies.get(ADMIN_COOKIE)?.value === getAdminCookieValue()
}

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  businessName: z.string().trim().min(1).max(200),
  type: z.enum(["QR_ONLY", "WEBSITE"]),
  flotMerchantId: z.string().trim().min(1).max(100),
})

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid merchant details" }, { status: 400 })
  }
  const { name, email, businessName, type, flotMerchantId } = parsed.data

  const existing = await db.merchant.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "A merchant with this email already exists" }, { status: 400 })
  }

  const existingFlotId = await db.merchant.findUnique({ where: { flotMerchantId } })
  if (existingFlotId) {
    return NextResponse.json({ error: "A merchant with this Flot ID already exists" }, { status: 400 })
  }

  const inviteToken = randomBytes(32).toString("hex")
  const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const webhookUsername = `flot_${flotMerchantId}`
  const webhookPassword = randomBytes(20).toString("hex")

  const merchant = await db.merchant.create({
    data: {
      name,
      email,
      businessName,
      type,
      flotMerchantId,
      passwordHash: "INVITE_PENDING",
      inviteToken,
      inviteExpiry,
      webhookUsername,
      webhookPassword,
    },
  })

  try {
    await sendInviteEmail({ email, name, businessName, token: inviteToken })
  } catch (err: any) {
    return NextResponse.json(
      { id: merchant.id, warning: `Merchant created but email failed: ${err?.message ?? "Unknown error"}. Use Resend Invite from the merchant list.` },
      { status: 207 }
    )
  }

  return NextResponse.json({ id: merchant.id })
}
