import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const merchant = await db.merchant.findUnique({
      where: { email: "demo@flotme.ai" },
    })

    if (!merchant) return NextResponse.json({ error: "Merchant not found" })

    const valid = await bcrypt.compare("admin123", merchant.passwordHash)

    return NextResponse.json({
      found: true,
      email: merchant.email,
      hasPasswordHash: !!merchant.passwordHash,
      passwordHashLength: merchant.passwordHash.length,
      passwordValid: valid,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
