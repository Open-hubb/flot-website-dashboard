import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  ORDER_TRANSITIONS,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/order-transitions"
import { StatusActions } from "./status-actions"

export const dynamic = "force-dynamic"

type OrderItem = { name: string; size?: string; qty: number; price: number }

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const order = await db.customerOrder.findFirst({
    where: { id: params.id, merchantId: session.user.id },
    include: { events: { orderBy: { createdAt: "asc" } } },
  })
  if (!order) notFound()

  const items = (order.items as OrderItem[]) ?? []
  const transitions = ORDER_TRANSITIONS[order.status]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/orders"
          className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {order.reference ?? `Order ${order.id.slice(-6).toUpperCase()}`}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
        <span
          className={cn(
            "ml-auto rounded-full px-3 py-1 text-xs font-semibold",
            STATUS_STYLES[order.status]
          )}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: items + history */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-base font-semibold">Items</h2>
            </div>
            <div className="divide-y">
              {items.length === 0 && (
                <p className="px-6 py-6 text-sm text-muted-foreground">No item details recorded.</p>
              )}
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.size && (
                      <p className="text-xs text-muted-foreground">{item.size}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {formatCurrency(item.price, order.currency)} × {item.qty}
                    </p>
                    <p className="font-medium">
                      {formatCurrency(item.price * item.qty, order.currency)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-6 py-4">
                <p className="text-sm font-semibold">Total</p>
                <p className="text-base font-bold">
                  {formatCurrency(Number(order.total), order.currency)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-base font-semibold">History</h2>
            </div>
            <div className="px-6 py-4">
              {order.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No status changes yet.</p>
              ) : (
                <ol className="space-y-4">
                  {order.events.map((ev) => (
                    <li key={ev.id} className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="space-y-0.5">
                        <p className="text-sm">
                          {ev.fromStatus
                            ? `${STATUS_LABELS[ev.fromStatus]} → ${STATUS_LABELS[ev.toStatus]}`
                            : STATUS_LABELS[ev.toStatus]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(ev.createdAt)} · {ev.changedBy}
                        </p>
                        {ev.note && <p className="text-xs text-muted-foreground italic">“{ev.note}”</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* Right: actions + customer + payment */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h2 className="mb-4 text-base font-semibold">Update status</h2>
            <StatusActions orderId={order.id} transitions={transitions} />
          </div>

          <div className="rounded-xl border bg-card shadow-sm p-6 space-y-2">
            <h2 className="text-base font-semibold">Customer</h2>
            <div className="text-sm">
              <p className="font-medium">{order.name}</p>
              <p className="text-muted-foreground">{order.phone}</p>
              <p className="text-muted-foreground">{order.address}, {order.city}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm p-6 space-y-2">
            <h2 className="text-base font-semibold">Payment</h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Status:{" "}
                <span className="font-medium text-foreground">{STATUS_LABELS[order.status]}</span>
              </p>
              <p>
                Flot request:{" "}
                <span className="font-mono text-xs">{order.flotRequestId ?? "—"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
