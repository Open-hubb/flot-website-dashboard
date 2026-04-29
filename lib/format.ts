import { format, formatDistanceToNow } from "date-fns"

export function formatCurrency(amount: number | string, currency: string = "SLE") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  if (currency === "USD") {
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `Le ${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy")
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy · h:mm a")
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
