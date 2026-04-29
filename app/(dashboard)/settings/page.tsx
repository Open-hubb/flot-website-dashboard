import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [merchant, notifPrefs] = await Promise.all([
    db.merchant.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        businessName: true,
        flotMerchantId: true,
        type: true,
      },
    }),
    db.notificationPrefs.findUnique({ where: { merchantId: session.user.id } }),
  ])
  if (!merchant) redirect("/login")

  return (
    <SettingsForm
      merchant={merchant}
      notifPrefs={
        notifPrefs ?? { emailDigest: true, newOrderAlert: true, digestFreq: "DAILY" }
      }
    />
  )
}
