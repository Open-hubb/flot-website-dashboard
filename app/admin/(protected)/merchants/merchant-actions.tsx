"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Trash2, Copy, Check, Webhook } from "lucide-react"

const APP_URL = "https://flot-dashboard.vercel.app"

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-xs font-mono truncate flex-1">{value || "—"}</span>
      <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export function WebhookCredentialsButton({
  username,
  password,
  flotMerchantId,
}: {
  username: string
  password: string
  flotMerchantId: string
}) {
  const [open, setOpen] = useState(false)
  const webhookUrl = `${APP_URL}/api/webhooks/flot/${flotMerchantId}`

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <Webhook className="h-3.5 w-3.5" />
        <span className="ml-1.5">Webhook</span>
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-80 rounded-xl border bg-card p-4 shadow-lg">
            <p className="text-sm font-semibold mb-3">Webhook Credentials</p>
            <div className="divide-y border rounded-lg px-3">
              <CopyRow label="URL" value={webhookUrl} />
              <CopyRow label="Username" value={username} />
              <CopyRow label="Password" value={password} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Provide these to Flot staff when registering the webhook.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

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
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
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
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
    </Button>
  )
}
