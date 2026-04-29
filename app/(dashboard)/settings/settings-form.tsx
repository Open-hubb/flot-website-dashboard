"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile, changePassword, updateNotifPrefs } from "./actions"
import { Eye, EyeOff } from "lucide-react"

interface Merchant {
  name: string
  email: string
  businessName: string
  flotMerchantId: string
  type: string
}

interface NotifPrefs {
  emailDigest: boolean
  newOrderAlert: boolean
  digestFreq: string
}

export function SettingsForm({
  merchant,
  notifPrefs,
}: {
  merchant: Merchant
  notifPrefs: NotifPrefs
}) {
  return (
    <div className="space-y-6 max-w-xl">
      <ProfileSection merchant={merchant} />
      <SecuritySection />
      <NotifSection prefs={notifPrefs} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function ProfileSection({ merchant }: { merchant: Merchant }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    startTransition(async () => {
      const result = await updateProfile(new FormData(form))
      setMsg(result?.error ? { text: result.error } : { ok: true, text: "Profile updated." })
    })
  }

  return (
    <Section title="Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" defaultValue={merchant.name} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessName">Business Name</Label>
          <Input id="businessName" name="businessName" defaultValue={merchant.businessName} required />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={merchant.email} disabled />
          <p className="text-xs text-muted-foreground">Email cannot be changed. Contact Flot support.</p>
        </div>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-green-600" : "text-destructive"}`}>{msg.text}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </Section>
  )
}

function SecuritySection() {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    startTransition(async () => {
      const result = await changePassword(new FormData(form))
      if (result?.error) {
        setMsg({ text: result.error })
      } else {
        setMsg({ ok: true, text: "Password changed successfully." })
        form.reset()
      }
    })
  }

  return (
    <Section title="Security">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="current">Current Password</Label>
          <div className="relative">
            <Input
              id="current"
              name="current"
              type={showCurrent ? "text" : "password"}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="next">New Password</Label>
          <div className="relative">
            <Input
              id="next"
              name="next"
              type={showNext ? "text" : "password"}
              required
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNext((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm New Password</Label>
          <Input id="confirm" name="confirm" type="password" required minLength={8} />
        </div>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-green-600" : "text-destructive"}`}>{msg.text}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating…" : "Change Password"}
        </Button>
      </form>
    </Section>
  )
}

function NotifSection({ prefs }: { prefs: NotifPrefs }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    startTransition(async () => {
      await updateNotifPrefs(new FormData(form))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <Section title="Notifications">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="newOrderAlert"
            defaultChecked={prefs.newOrderAlert}
            className="h-4 w-4 rounded"
          />
          <div>
            <p className="text-sm font-medium">New payment alerts</p>
            <p className="text-xs text-muted-foreground">Get notified when a payment is received</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="emailDigest"
            defaultChecked={prefs.emailDigest}
            className="h-4 w-4 rounded"
          />
          <div>
            <p className="text-sm font-medium">Email digest</p>
            <p className="text-xs text-muted-foreground">Receive a summary of your transactions</p>
          </div>
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="digestFreq">Digest Frequency</Label>
          <select
            id="digestFreq"
            name="digestFreq"
            defaultValue={prefs.digestFreq}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>
        <Button type="submit" disabled={isPending}>
          {saved ? "Saved!" : isPending ? "Saving…" : "Save Preferences"}
        </Button>
      </form>
    </Section>
  )
}

