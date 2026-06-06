import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { DEFAULT_PAGES } from "@/lib/cms-types"
import { CmsEditor } from "./cms-editor"

export default async function CmsEditPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true, flotMerchantId: true },
  })

  if (merchant?.type !== "WEBSITE") redirect("/")

  const { slug } = params
  const pageDef = DEFAULT_PAGES.find((p) => p.slug === slug)
  if (!pageDef) notFound()

  const existing = await db.cmsPage.findUnique({
    where: { merchantId_slug: { merchantId: session.user.id, slug } },
  })

  const media = await db.cmsMedia.findMany({
    where: { merchantId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const initialContent = existing
    ? (existing.draftContent as any)
    : { blocks: pageDef.defaultBlocks }

  return (
    <CmsEditor
      slug={slug}
      title={existing?.title ?? pageDef.title}
      initialContent={initialContent}
      status={existing?.status ?? "DRAFT"}
      publishedAt={existing?.publishedAt?.toISOString() ?? null}
      flotMerchantId={merchant.flotMerchantId}
      media={media.map((m) => ({ id: m.id, url: m.url, filename: m.filename }))}
    />
  )
}
