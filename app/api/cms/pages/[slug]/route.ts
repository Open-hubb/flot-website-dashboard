import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { savePageSchema, publishSchema } from "@/lib/cms-validation"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = params

  const page = await db.cmsPage.findUnique({
    where: { merchantId_slug: { merchantId: session.user.id, slug } },
  })

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 })
  }

  return NextResponse.json(page)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = params
  const body = await req.json().catch(() => null)

  const parsed = savePageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid page content", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { title, draftContent } = parsed.data

  const page = await db.cmsPage.upsert({
    where: { merchantId_slug: { merchantId: session.user.id, slug } },
    update: { title, draftContent, status: "DRAFT" },
    create: {
      merchantId: session.user.id,
      slug,
      title,
      draftContent,
      status: "DRAFT",
    },
  })

  return NextResponse.json(page)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = params
  const body = await req.json().catch(() => null)

  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const page = await db.cmsPage.findUnique({
    where: { merchantId_slug: { merchantId: session.user.id, slug } },
  })

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 })
  }

  const updated = await db.cmsPage.update({
    where: { id: page.id },
    data: {
      publishedContent: page.draftContent as any,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  })

  return NextResponse.json(updated)
}
