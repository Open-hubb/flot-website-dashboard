import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@prisma/client"

const PAGE_SIZE = 20
const BADGE_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string }
}) {
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
          Order management is available for merchants with a Flot-integrated website.
        </p>
      </div>
    )
  }

  const page = Math.max(1, parseInt(searchParams.page ?? "1"))
  const rawStatus = searchParams.status ?? ""
  const status =
    rawStatus && ["COMPLETED", "PENDING", "FAILED"].includes(rawStatus)
      ? (rawStatus as OrderStatus)
      : undefined

  const where = { merchantId: session.user.id, ...(status ? { status } : {}) }
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
  ])
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const filterHref = (s: string) => (s ? `/orders?status=${s}` : "/orders")
  const pageHref = (p: number) => `/orders?page=${p}${status ? `&status=${status}` : ""}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["", "COMPLETED", "PENDING", "FAILED"] as const).map((s) => (
          <Link
            key={s || "all"}
            href={filterHref(s)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              rawStatus === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {s || "All"}
          </Link>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">{total} orders</span>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm font-medium">{order.orderId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(order.receivedAt)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {order.amount
                      ? formatCurrency(Number(order.amount), order.currency ?? "SLE")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm capitalize text-muted-foreground">
                    {order.paymentType ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={BADGE_VARIANT[order.status]}>
                      {order.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <button disabled className={cn(buttonVariants({ variant: "outline", size: "sm" }), "opacity-40")}>
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button disabled className={cn(buttonVariants({ variant: "outline", size: "sm" }), "opacity-40")}>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
