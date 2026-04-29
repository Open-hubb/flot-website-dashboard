import { NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const merchant = await db.merchant.findUnique({
          where: { email: credentials.email },
        })

        if (!merchant?.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, merchant.passwordHash)
        if (!valid) return null

        return {
          id: merchant.id,
          email: merchant.email,
          name: merchant.name,
          flotMerchantId: merchant.flotMerchantId,
          type: merchant.type,
          businessName: merchant.businessName,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.merchantId = user.id
        token.flotMerchantId = (user as any).flotMerchantId
        token.type = (user as any).type
        token.businessName = (user as any).businessName
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.merchantId as string
        ;(session.user as any).flotMerchantId = token.flotMerchantId
        ;(session.user as any).type = token.type
        ;(session.user as any).businessName = token.businessName
      }
      return session
    },
  },
}

export const auth = () => getServerSession(authOptions)
