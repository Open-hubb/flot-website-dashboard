import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { deleteMediaSchema } from "@/lib/cms-validation"
import { put, del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const media = await db.cmsMedia.findMany({
    where: { merchantId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(media)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const maxSize = 4.5 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File too large (max 4.5MB)" }, { status: 400 })
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }

  const blob = await put(`cms/${session.user.id}/${Date.now()}-${file.name}`, file, {
    access: "public",
  })

  const media = await db.cmsMedia.create({
    data: {
      merchantId: session.user.id,
      url: blob.url,
      filename: file.name,
      type: file.type,
      size: file.size,
    },
  })

  return NextResponse.json(media)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = deleteMediaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const media = await db.cmsMedia.findFirst({
    where: { id: parsed.data.id, merchantId: session.user.id },
  })

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    await del(media.url)
  } catch {
    // blob may already be deleted
  }

  await db.cmsMedia.delete({ where: { id: media.id } })

  return NextResponse.json({ success: true })
}
