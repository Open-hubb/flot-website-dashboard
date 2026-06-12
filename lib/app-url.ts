/**
 * Canonical public URL of this dashboard. Used for webhook endpoint URLs,
 * the analytics tracker beacon, and links in outgoing emails.
 *
 * Set NEXT_PUBLIC_APP_URL in the environment to the real production domain
 * (e.g. the custom domain once it's wired). The fallback is the current
 * working Vercel URL — NOT the old `flot-dashboard.vercel.app`, which belongs
 * to an unrelated/broken project.
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://flot-dashboard-seven.vercel.app"
