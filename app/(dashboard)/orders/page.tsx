import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatDateTime, formatCurrency } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Lock, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { ALL_STATUSES, STATUS_LABELS, STATUS_STYLES } from "@/lib/order-transitions"
import type { CustomerOrderStatus, Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 20
const FILTERS: ("" | CustomerOrderStatus)[] = ["", ...ALL_STATUSES]

type OrderItem = { name: string; size?: string; qty: number }

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; q?: string }
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
  const status = (ALL_STATUSES as string[]).includes(rawStatus)
    ? (rawStatus as CustomerOrderStatus)
    : undefined
  const q = (searchParams.q ?? "").trim()

  const where: Prisma.CustomerOrderWhereInput = {
    merchantId: session.user.id,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [orders, total] = await Promise.all([
    db.customerOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.customerOrder.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const qs = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams()
    if (status) p.set("status", status)
    if (q) p.set("q", q)
    for (const [k, v] of Object.entries(extra)) {
      if (v === undefined || v === "") p.delete(k)
      else p.set(k, String(v))
    }
    const s = p.toString()
    return s ? `/orders?${s}` : "/orders"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/orders?status=${s}` : "/orders"}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              rawStatus === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {s ? STATUS_LABELS[s] : "All"}
          </Link>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">{total} orders</span>
      </div>

      <form method="get" className="relative max-w-sm">
        {status && <input type="hidden" name="status" value={status} />}
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone, or reference…"
          className="pl-9"
        />
      </form>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  {q || status
                    ? "No orders match your filters."
                    : "No orders yet. Orders appear here when customers place them on your website."}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const items = (order.items as OrderItem[]) ?? []
                const itemSummary = items
                  .map((i) => `${i.name}${i.size ? ` (${i.size})` : ""} ×${i.qty}`)
                  .join(", ")
                return (
                  <TableRow key={order.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono text-sm font-medium text-primary hover:underline"
                      >
                        {order.reference ?? order.id.slice(-6).toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{order.name}</p>
                      <p className="text-xs text-muted-foreground">{order.phone} · {order.city}</p>
                    </TableCell>
                    <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                      <span title={itemSummary} className="line-clamp-2">{itemSummary}</span>
                    </TableCell>
                    <TableCell className="font-semibold whitespace-nowrap">
                      {formatCurrency(Number(order.total), order.currency)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                          STATUS_STYLES[order.status]
                        )}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={qs({ page: page - 1 })} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <button disabled className={cn(buttonVariants({ variant: "outline", size: "sm" }), "opacity-40")}>
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {page < totalPages ? (
              <Link href={qs({ page: page + 1 })} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
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
