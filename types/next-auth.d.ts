import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      flotMerchantId: string
      type: "QR_ONLY" | "WEBSITE"
      businessName: string
    }
  }
}
