"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle } from "lucide-react"

export default function SetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (password !== confirm) { setError("Passwords do not match."); return }

    setLoading(true)
    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    setLoading(false)

    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push("/login"), 2000)
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? "Something went wrong. The link may have expired.")
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Invalid or missing invite link.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex items-baseline">
            <span className="text-4xl font-bold tracking-tight text-foreground">flot</span>
            <span className="text-4xl font-bold text-primary">.</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Set up your account</p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="h-10 w-10 text-primary" />
              <p className="font-medium">Password set! Redirecting to login…</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold">Create your password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  You&apos;ll use this to sign in to your Flot dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Set password &amp; sign in
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
