import { PrismaClient } from "@prisma/client"
import { randomBytes } from "crypto"

const db = new PrismaClient()

async function main() {
  const merchants = await db.merchant.findMany({
    where: { webhookUsername: "" },
    select: { id: true, businessName: true, flotMerchantId: true },
  })

  if (merchants.length === 0) {
    console.log("No merchants need credentials.")
    return
  }

  console.log(`Generating credentials for ${merchants.length} merchant(s)...\n`)

  for (const m of merchants) {
    const webhookUsername = `flot_${m.flotMerchantId}`
    const webhookPassword = randomBytes(20).toString("hex")

    await db.merchant.update({
      where: { id: m.id },
      data: { webhookUsername, webhookPassword },
    })

    console.log(`✓ ${m.businessName}`)
    console.log(`  Username: ${webhookUsername}`)
    console.log(`  Password: ${webhookPassword}`)
    console.log(`  Webhook URL: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://flot-dashboard.vercel.app"}/api/webhooks/flot/${m.flotMerchantId}\n`)
  }

  console.log("Done.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
