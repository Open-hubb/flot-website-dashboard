import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12)

  const merchant = await db.merchant.upsert({
    where: { email: "demo@flotme.ai" },
    update: {},
    create: {
      email: "demo@flotme.ai",
      passwordHash,
      name: "Demo Merchant",
      businessName: "Demo Store",
      type: "WEBSITE",
      flotMerchantId: "00000000-0000-0000-0000-000000000001",
      webhookUsername: "demo",
      webhookPassword: "demo-webhook-secret",
    },
  })

  console.log(`✅ Merchant created: ${merchant.email}`)
  console.log(`   Password: admin123`)
  console.log(`   Type: ${merchant.type}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
