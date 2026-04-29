"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function markAllRead() {
  const session = await auth()
  if (!session?.user?.id) return

  await db.inAppNotification.updateMany({
    where: { merchantId: session.user.id, read: false },
    data: { read: true },
  })
  revalidatePath("/notifications")
}

export async function markOneRead(id: string) {
  const session = await auth()
  if (!session?.user?.id) return

  await db.inAppNotification.updateMany({
    where: { id, merchantId: session.user.id },
    data: { read: true },
  })
  revalidatePath("/notifications")
}
