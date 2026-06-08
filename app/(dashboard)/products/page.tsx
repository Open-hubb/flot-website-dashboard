import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Lock, ExternalLink, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ProductsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true, flotMerchantId: true, sanityStudioUrl: true },
  })

  if (merchant?.type !== "WEBSITE") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="mb-4 h-10 w-10 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-semibold">Website merchants only</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Product management is available for merchants with a Flot-integrated website.
        </p>
      </div>
    )
  }

  const studioUrl = merchant.sanityStudioUrl

  if (!studioUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Package className="h-7 w-7 text-muted-foreground opacity-40" />
        </div>
        <h2 className="text-lg font-semibold">Products not set up yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your Sanity Studio hasn&apos;t been configured for this account. Contact Flot support to get it set up.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Package className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Products are managed in Sanity</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Your product catalogue is powered by Sanity CMS. Open the Sanity Studio to add, edit, or remove products from your website.
        </p>
        <div className="mt-6">
          <a href={studioUrl} target="_blank" rel="noopener noreferrer">
            <Button>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Sanity Studio
            </Button>
          </a>
        </div>
      </div>

      <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Managing products</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Open Sanity Studio to add and manage products</li>
          <li>Changes publish to your website in real time</li>
          <li>Product prices sync with Flot&apos;s checkout automatically</li>
          <li>Contact your Flot account manager to configure Sanity access</li>
        </ul>
      </div>
    </div>
  )
}
