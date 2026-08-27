import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAdminCookieValue, ADMIN_COOKIE } from "@/lib/admin-auth"
import { z } from "zod"

function isAdmin(req: NextRequest) {
  return req.cookies.get(ADMIN_COOKIE)?.value === getAdminCookieValue()
}

const patchSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

// Update a merchant's email + name (handover to the real merchant).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid name and email." }, { status: 400 })
  }
  const email = parsed.data.email.trim().toLowerCase()
  const name = parsed.data.name.trim()

  // Email must be unique across merchants.
  const clash = await db.merchant.findFirst({
    where: { email, id: { not: params.id } },
    select: { id: true },
  })
  if (clash) {
    return NextResponse.json({ error: "That email is already used by another merchant." }, { status: 409 })
  }

  try {
    await db.merchant.update({ where: { id: params.id }, data: { email, name } })
  } catch {
    return NextResponse.json({ error: "Merchant not found." }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.merchant.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
