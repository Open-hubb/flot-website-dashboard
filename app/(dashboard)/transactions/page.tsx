import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatDateTime } from "@/lib/format"
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
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@prisma/client"

const PAGE_SIZE = 20

const STATUS_FILTERS = ["", "COMPLETED", "PENDING", "FAILED"] as const
const BADGE_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
}

function parsePage(value: string | undefined) {
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const requestedPage = parsePage(searchParams.page)
  const rawStatus = searchParams.status ?? ""
  const status =
    rawStatus && ["COMPLETED", "PENDING", "FAILED"].includes(rawStatus)
      ? (rawStatus as OrderStatus)
      : undefined

  const where = { merchantId: session.user.id, ...(status ? { status } : {}) }

  const total = await db.order.count({ where })
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1
  const orders = await db.order.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  function filterHref(s: string) {
    return s ? `/transactions?status=${s}` : "/transactions"
  }
  function pageHref(p: number) {
    return `/transactions?page=${p}${status ? `&status=${status}` : ""}`
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s || "all"}
            href={filterHref(s)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              (status ?? "") === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {s || "All"}
          </Link>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">{total} transactions</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Flot Request ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm font-medium">{order.orderId}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {order.flotRequestId ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(order.receivedAt)}
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

      {/* Pagination */}
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
