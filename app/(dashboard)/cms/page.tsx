import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Lock, ExternalLink, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function CmsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true, businessName: true, sanityStudioUrl: true },
  })

  if (merchant?.type !== "WEBSITE") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="mb-4 h-10 w-10 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-semibold">Website merchants only</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          CMS access is available for merchants with a Flot-integrated website.
        </p>
      </div>
    )
  }

  const studioUrl = merchant.sanityStudioUrl

  if (!studioUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Layers className="h-7 w-7 text-muted-foreground opacity-40" />
        </div>
        <h2 className="text-lg font-semibold">CMS not set up yet</h2>
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
          <Layers className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Website Content Management</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Edit your website content — hero text, banners, about section, and more — using Sanity Studio.
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

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: "Products", desc: "Add, edit, and remove products from your catalogue" },
          { title: "Homepage", desc: "Update hero banners, featured products, and promotions" },
          { title: "About", desc: "Edit your business description and contact details" },
          { title: "Navigation", desc: "Manage menu items and category links" },
        ].map((item) => (
          <a
            key={item.title}
            href={studioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border bg-card p-5 shadow-sm hover:border-primary/40 transition-colors"
          >
            <p className="font-medium group-hover:text-primary transition-colors">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
