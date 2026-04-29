"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Trash2 } from "lucide-react"

export function ResendInviteButton({ merchantId, email }: { merchantId: string; email: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle")
  const [errMsg, setErrMsg] = useState("")
  const router = useRouter()

  async function handleResend() {
    setLoading(true)
    setStatus("idle")
    const res = await fetch(`/api/admin/merchants/${merchantId}/invite`, { method: "POST" })
    setLoading(false)
    if (res.ok) {
      setStatus("sent")
      router.refresh()
      setTimeout(() => setStatus("idle"), 3000)
    } else {
      const data = await res.json().catch(() => ({}))
      setErrMsg(data.error ?? "Failed to send")
      setStatus("error")
      setTimeout(() => setStatus("idle"), 5000)
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <Button variant="outline" size="sm" onClick={handleResend} disabled={loading}>
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Mail className="h-3.5 w-3.5" />
        )}
        <span className="ml-1.5">
          {status === "sent" ? "Sent!" : status === "error" ? "Failed" : "Resend"}
        </span>
      </Button>
      {status === "error" && (
        <p className="text-xs text-destructive max-w-[180px] text-right">{errMsg}</p>
      )}
    </div>
  )
}

export function DeleteMerchantButton({
  merchantId,
  businessName,
}: {
  merchantId: string
  businessName: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete ${businessName}? This cannot be undone.`)) return
    setLoading(true)
    await fetch(`/api/admin/merchants/${merchantId}`, { method: "DELETE" })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}>
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      )}
    </Button>
  )
}
