"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Trash2, Copy, Check, KeyRound, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { APP_URL } from "@/lib/app-url"

// Edit a merchant's email + name (for handover to the real merchant), then
// send them a set-password invite so they choose their own password.
export function EditMerchantButton({
  merchantId,
  email: initialEmail,
  name: initialName,
}: {
  merchantId: string
  email: string
  name: string
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(initialEmail)
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [status, setStatus] = useState<{ kind: "idle" | "saved" | "invited" | "error"; msg?: string }>({ kind: "idle" })
  const router = useRouter()

  const dirty = email.trim() !== initialEmail || name.trim() !== initialName

  async function save(): Promise<boolean> {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus({ kind: "error", msg: "Enter a valid email." })
      return false
    }
    setSaving(true)
    setStatus({ kind: "idle" })
    const res = await fetch(`/api/admin/merchants/${merchantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim() }),
    })
    setSaving(false)
    if (res.ok) {
      setStatus({ kind: "saved", msg: "Saved." })
      router.refresh()
      return true
    }
    const data = await res.json().catch(() => ({}))
    setStatus({ kind: "error", msg: data.error ?? "Couldn't save." })
    return false
  }

  async function saveAndInvite() {
    // Persist any email/name change first, then send the set-password invite.
    if (dirty) {
      const ok = await save()
      if (!ok) return
    }
    setInviting(true)
    setStatus({ kind: "idle" })
    const res = await fetch(`/api/admin/merchants/${merchantId}/invite`, { method: "POST" })
    setInviting(false)
    if (res.ok) {
      setStatus({ kind: "invited", msg: `Invite sent to ${email.trim()}.` })
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setStatus({ kind: "error", msg: data.error ?? "Invite failed to send." })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => { setEmail(initialEmail); setName(initialName); setStatus({ kind: "idle" }); setOpen(true) }}
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit merchant</DialogTitle>
          <DialogDescription>
            Set the merchant&apos;s real email, then send a set-password invite so they choose their own password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Name</Label>
            <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-email">Email</Label>
            <Input id="m-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@business.com" />
          </div>
          {status.kind !== "idle" && (
            <p className={status.kind === "error" ? "text-sm text-destructive" : "text-sm text-link"}>{status.msg}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={save} disabled={saving || inviting || !dirty}>
            {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Save
          </Button>
          <Button onClick={saveAndInvite} disabled={saving || inviting}>
            {inviting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-2 h-3.5 w-3.5" />}
            {dirty ? "Save & send invite" : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
