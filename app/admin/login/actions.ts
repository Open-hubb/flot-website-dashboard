"use server"

import { cookies } from "next/headers"
import { getAdminCookieValue, ADMIN_COOKIE } from "@/lib/admin-auth"
import { redirect } from "next/navigation"

export async function adminLogin(password: string): Promise<{ error: string }> {
  if (!process.env.ADMIN_SECRET || password !== process.env.ADMIN_SECRET) {
    return { error: "Incorrect password." }
  }

  cookies().set(ADMIN_COOKIE, getAdminCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect("/admin/merchants")
}

export async function adminLogout() {
  cookies().set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 })
  redirect("/admin/login")
}
