"use client"

import { Button } from "@/components/ui/button"
import { adminLogout } from "./login/actions"

export function AdminSignOut() {
  return (
    <form action={adminLogout}>
      <Button variant="ghost" size="sm" type="submit">
        Sign out
      </Button>
    </form>
  )
}
