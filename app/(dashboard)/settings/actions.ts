"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const name = (formData.get("name") as string | null)?.trim()
  const businessName = (formData.get("businessName") as string | null)?.trim()

  if (!name || !businessName) return { error: "Name and business name are required" }

  await db.merchant.update({
    where: { id: session.user.id },
    data: { name, businessName },
  })
  revalidatePath("/settings")
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const current = formData.get("current") as string | null
  const next = formData.get("next") as string | null
  const confirm = formData.get("confirm") as string | null

  if (!current || !next || !confirm) return { error: "All fields are required" }
  if (next !== confirm) return { error: "New passwords do not match" }
  if (next.length < 8) return { error: "Password must be at least 8 characters" }

  const merchant = await db.merchant.findUnique({ where: { id: session.user.id } })
  if (!merchant) return { error: "Merchant not found" }

  const valid = await bcrypt.compare(current, merchant.passwordHash)
  if (!valid) return { error: "Current password is incorrect" }

  const hash = await bcrypt.hash(next, 12)
  await db.merchant.update({ where: { id: session.user.id }, data: { passwordHash: hash } })
  return { success: true }
}

export async function updateNotifPrefs(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const emailDigest = formData.get("emailDigest") === "on"
  const newOrderAlert = formData.get("newOrderAlert") === "on"
  const digestFreq = (formData.get("digestFreq") as string) || "DAILY"

  await db.notificationPrefs.upsert({
    where: { merchantId: session.user.id },
    update: { emailDigest, newOrderAlert, digestFreq },
    create: { merchantId: session.user.id, emailDigest, newOrderAlert, digestFreq },
  })
  revalidatePath("/settings")
  return { success: true }
}
