import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Lock } from "lucide-react"
import { ProductsEditor } from "./products-editor"

export default async function ProductsPage() {
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
          Product management is available for merchants with a Flot-integrated website.
        </p>
      </div>
    )
  }

  const products = await db.product.findMany({
    where: { merchantId: session.user.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })

  return (
    <ProductsEditor
      flotMerchantId={merchant.flotMerchantId}
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        currency: p.currency,
        image: p.image ?? "",
        category: p.category ?? "",
        description: p.description ?? "",
        badge: p.badge ?? "",
        order: p.order,
        active: p.active,
      }))}
    />
  )
}
