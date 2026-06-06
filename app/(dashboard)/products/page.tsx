import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Lock, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ProductsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true },
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Package className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Product Management</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Manage your products through the CMS. Add products as service items on your Services page,
          or upload product images to the Media Library.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/cms/services">
            <Button>
              <ArrowRight className="mr-2 h-4 w-4" />
              Edit Services Page
            </Button>
          </Link>
          <Link href="/cms/media">
            <Button variant="outline">
              Upload Images
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
