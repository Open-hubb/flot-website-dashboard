import type { CustomerOrderStatus } from "@prisma/client"

export const ALL_STATUSES: CustomerOrderStatus[] = [
  "PENDING",
  "PAID",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
]

// The merchant-driven fulfillment state machine. PENDING -> PAID normally
// happens automatically via the Flot webhook, but is allowed manually too.
// Terminal states map to []. This map is the single source of truth — the
// UI reads it to decide which buttons to render and the API reads it to
// decide which transitions to accept.
export const ORDER_TRANSITIONS: Record<CustomerOrderStatus, CustomerOrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

export function canTransition(from: CustomerOrderStatus, to: CustomerOrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false
}

export const STATUS_LABELS: Record<CustomerOrderStatus, string> = {
  PENDING: "Pending payment",
  PAID: "Paid",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

// Tailwind pill classes per status.
export const STATUS_STYLES: Record<CustomerOrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-sky-100 text-sky-800",
  PREPARING: "bg-violet-100 text-violet-800",
  READY: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
}
