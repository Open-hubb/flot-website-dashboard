import { createHash } from "crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const ADMIN_COOKIE = "flot-admin"

export function getAdminCookieValue(): string {
  const secret = process.env.ADMIN_SECRET ?? ""
  return createHash("sha256").update(`flot-admin:${secret}`).digest("hex")
}

export async function requireAdmin() {
  const jar = cookies()
  const cookie = jar.get(ADMIN_COOKIE)
  if (cookie?.value !== getAdminCookieValue()) {
    redirect("/admin/login")
  }
}
