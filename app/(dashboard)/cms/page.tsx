import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Lock, FileText, Image as ImageIcon, ChevronRight, CheckCircle2, Clock } from "lucide-react"
import { DEFAULT_PAGES } from "@/lib/cms-types"
import { formatDateTime } from "@/lib/format"
import Link from "next/link"

export default async function CmsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true, businessName: true },
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

  const existingPages = await db.cmsPage.findMany({
    where: { merchantId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  const pageMap = new Map(existingPages.map((p) => [p.slug, p]))

  const mediaCount = await db.cmsMedia.count({
    where: { merchantId: session.user.id },
  })

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{DEFAULT_PAGES.length}</p>
              <p className="text-xs text-muted-foreground">Total Pages</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {existingPages.filter((p) => p.status === "PUBLISHED").length}
              </p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
          </div>
        </div>
        <Link href="/cms/media" className="group">
          <div className="rounded-xl border bg-card p-5 shadow-sm group-hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <ImageIcon className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mediaCount}</p>
                <p className="text-xs text-muted-foreground">Media Files</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Page list */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Website Pages</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Edit your website content. Changes are saved as drafts until you publish.
          </p>
        </div>
        <div className="divide-y">
          {DEFAULT_PAGES.map((page) => {
            const existing = pageMap.get(page.slug)
            const isPublished = existing?.status === "PUBLISHED"

            return (
              <Link
                key={page.slug}
                href={`/cms/${page.slug}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {page.title}
                    </p>
                    <p className="text-xs text-muted-foreground">/{page.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {existing ? (
                    <>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDateTime(existing.updatedAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isPublished
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-amber-500/10 text-amber-700"
                        }`}
                      >
                        {isPublished ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {isPublished ? "Published" : "Draft"}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not started</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
