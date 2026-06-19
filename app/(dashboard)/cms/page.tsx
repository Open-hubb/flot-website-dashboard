import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Lock } from "lucide-react"
import { withDefaults } from "@/lib/site-content"
import { SiteContentEditor } from "./site-content-editor"

export default async function CmsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true, flotMerchantId: true },
  })

  if (merchant?.type !== "WEBSITE") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="mb-4 h-10 w-10 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-semibold">Website merchants only</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Website content editing is available for merchants with a Flot-integrated website.
        </p>
      </div>
    )
  }

  const row = await db.siteContent.findUnique({ where: { merchantId: session.user.id } })

  return (
    <SiteContentEditor
      flotMerchantId={merchant.flotMerchantId}
      initialContent={withDefaults(row?.content)}
    />
  )
}
