"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Trash2, Copy, Check, KeyRound, Layers } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

import { APP_URL } from "@/lib/app-url"

function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
        <span className={`flex-1 text-sm truncate ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
        <button
          onClick={copy}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {copied
            ? <Check className="h-3.5 w-3.5 text-green-500" />
            : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
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
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Webhook
      </button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Webhook Setup</DialogTitle>
          <DialogDescription>
            Provide these credentials to Flot staff when registering this merchant&apos;s webhook.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <CopyField label="Endpoint URL" value={webhookUrl} />
          <CopyField label="Username" value={username} />
          <CopyField label="Password" value={password} />
        </div>

        <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
          Flot will POST to this URL with Basic Auth on every payment event.
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

export function SanityUrlButton({
  merchantId,
  currentUrl,
}: {
  merchantId: string
  currentUrl: string
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(currentUrl)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/admin/merchants/${merchantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sanityStudioUrl: url }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => { setSaved(false); setOpen(false) }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Layers className="h-3.5 w-3.5" />
        Sanity
      </button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sanity Studio URL</DialogTitle>
          <DialogDescription>
            Set the Sanity Studio URL for this merchant. It will appear as the link on their CMS and Products pages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <label className="text-xs font-medium text-muted-foreground">Studio URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-merchant-site.com/studio"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            This is typically <code className="bg-muted px-1 rounded">https://merchant-site.com/studio</code> if embedded in their Next.js site.
          </p>
        </div>

        <DialogFooter>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
            {saved ? "Saved!" : saving ? "Saving…" : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
    </Button>
  )
}
