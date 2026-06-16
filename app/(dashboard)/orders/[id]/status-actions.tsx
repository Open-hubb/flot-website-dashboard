"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { STATUS_LABELS } from "@/lib/order-transitions"
import type { CustomerOrderStatus } from "@prisma/client"

export function StatusActions({
  orderId,
  transitions,
}: {
  orderId: string
  transitions: CustomerOrderStatus[]
}) {
  const router = useRouter()
  const [note, setNote] = useState("")
  const [pending, setPending] = useState<CustomerOrderStatus | null>(null)
  const [error, setError] = useState("")

  async function move(to: CustomerOrderStatus) {
    setPending(to)
    setError("")
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to, note: note || undefined }),
    })
    setPending(null)
    if (res.ok) {
      setNote("")
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Something went wrong.")
    }
  }

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This order is in a final state — no further actions available.
      </p>
    )
  }

  // The "cancel" action is visually separated from forward progress.
  const forward = transitions.filter((t) => t !== "CANCELLED")
  const canCancel = transitions.includes("CANCELLED")

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add an optional note (saved to the order history)…"
        rows={2}
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

      <div className="flex flex-col gap-2">
        {forward.map((to) => (
          <Button key={to} onClick={() => move(to)} disabled={pending !== null} className="w-full justify-center">
            {pending === to && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark as {STATUS_LABELS[to]}
          </Button>
        ))}
        {canCancel && (
          <Button
            variant="outline"
            onClick={() => move("CANCELLED")}
            disabled={pending !== null}
            className="w-full justify-center text-red-600 hover:text-red-700"
          >
            {pending === "CANCELLED" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel order
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
