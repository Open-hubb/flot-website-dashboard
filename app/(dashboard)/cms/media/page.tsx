import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { MediaLibrary } from "./media-library"

export default async function MediaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { type: true },
  })

  if (merchant?.type !== "WEBSITE") redirect("/")

  const media = await db.cmsMedia.findMany({
    where: { merchantId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <MediaLibrary
      initialMedia={media.map((m) => ({
        id: m.id,
        url: m.url,
        filename: m.filename,
        type: m.type,
        size: m.size,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  )
}
