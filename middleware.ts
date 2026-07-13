import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl
        const isPublic =
          pathname.startsWith("/login") ||
          pathname.startsWith("/forgot-password") ||
          pathname.startsWith("/set-password") ||
          pathname.startsWith("/site") ||
          pathname.startsWith("/api/public") ||
          pathname.startsWith("/api/webhooks") ||
          pathname.startsWith("/api/debug") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/api/admin")

        if (isPublic) return true
        return !!token
      },
    },
  }
)

export const config = {
  // Skip Next internals and static asset files (images, fonts, etc.) so they
  // serve directly instead of being auth-redirected.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|txt|xml)$).*)",
  ],
}
