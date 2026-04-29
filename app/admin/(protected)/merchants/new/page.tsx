"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewMerchantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      businessName: form.get("businessName"),
      type: form.get("type"),
      flotMerchantId: form.get("flotMerchantId"),
    }

    const res = await fetch("/api/admin/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setLoading(false)

    const data = await res.json().catch(() => ({}))
    if (res.ok || res.status === 207) {
      if (data.warning) setError(data.warning)
      else { router.push("/admin/merchants"); router.refresh() }
    } else {
      setError(data.error ?? "Something went wrong.")
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/merchants">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Invite Merchant</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            An invite email will be sent so the merchant can set their password.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Contact Name</Label>
            <Input id="name" name="name" placeholder="John Conteh" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="john@business.com" required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="businessName">Business Name</Label>
          <Input id="businessName" name="businessName" placeholder="Conteh Supermarket" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Merchant Type</Label>
          <select
            id="type"
            name="type"
            required
            defaultValue="QR_ONLY"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="QR_ONLY">QR Only — pay via QR scan, no website</option>
            <option value="WEBSITE">Website — Flot-integrated website</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="flotMerchantId">Flot Merchant ID</Label>
          <Input
            id="flotMerchantId"
            name="flotMerchantId"
            placeholder="From the Flot backend"
            required
          />
          <p className="text-xs text-muted-foreground">The merchant&apos;s ID in the Flot system</p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/merchants">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create &amp; Send Invite
          </Button>
        </div>
      </form>
    </div>
  )
}
