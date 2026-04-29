import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { token, password } = parsed.data

  const merchant = await db.merchant.findUnique({
    where: { inviteToken: token },
  })

  if (!merchant) {
    return NextResponse.json({ error: "Invalid or expired invite link." }, { status: 400 })
  }

  if (merchant.inviteExpiry && merchant.inviteExpiry < new Date()) {
    return NextResponse.json({ error: "This invite link has expired." }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.merchant.update({
    where: { id: merchant.id },
    data: { passwordHash, inviteToken: null, inviteExpiry: null },
  })

  return NextResponse.json({ ok: true })
}
