import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Lock } from "lucide-react"
import { withMenuDefaults } from "@/lib/menu-content"
import { MenuEditor } from "./menu-editor"

export default async function MenuPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true, flotMerchantId: true, siteUrl: true },
  })

  if (merchant?.type !== "WEBSITE") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="mb-4 h-10 w-10 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-semibold">Website merchants only</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Menu editing is available for merchants with a Flot-integrated menu site.
        </p>
      </div>
    )
  }

  const row = await db.menuContent.findUnique({ where: { merchantId: session.user.id } })

  return (
    <MenuEditor
      flotMerchantId={merchant.flotMerchantId}
      siteUrl={merchant.siteUrl ?? ""}
      initialContent={withMenuDefaults(row?.content)}
    />
  )
}
