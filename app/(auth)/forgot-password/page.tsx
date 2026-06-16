"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MailCheck } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex items-baseline">
            <span className="text-4xl font-bold tracking-tight text-foreground">flot</span>
            <span className="text-4xl font-bold text-primary">.</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Merchant Dashboard</p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <MailCheck className="h-10 w-10 text-primary" />
              <p className="font-medium">Check your email</p>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a
                link to reset your password. It expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold">Reset your password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
