"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { adminLogin } from "./actions"

export default function AdminLoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await adminLogin(password)
    // If we reach here, login failed (success redirects server-side)
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex items-baseline">
            <span className="text-4xl font-bold tracking-tight text-foreground">flot</span>
            <span className="text-4xl font-bold text-primary">.</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Admin Portal</p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Admin sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Flot staff only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Admin password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
