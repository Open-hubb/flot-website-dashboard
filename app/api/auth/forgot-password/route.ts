import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/invite"
import { randomBytes } from "crypto"
import { z } from "zod"

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)

  // Always respond the same way — never reveal whether an account exists.
  const ok = NextResponse.json({ ok: true })
  if (!parsed.success) return ok

  const merchant = await db.merchant.findUnique({
    where: { email: parsed.data.email },
  })
  if (!merchant) return ok

  const token = randomBytes(32).toString("hex")
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await db.merchant.update({
    where: { id: merchant.id },
    data: { inviteToken: token, inviteExpiry: expiry },
  })

  try {
    await sendPasswordResetEmail({ email: merchant.email, name: merchant.name, token })
  } catch {
    // Swallow email errors — still respond ok so we don't leak account state.
  }

  return ok
}
