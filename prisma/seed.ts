import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

function homeContent(name: string, tagline: string, image: string) {
  return {
    blocks: [
      {
        type: "hero",
        title: `Welcome to ${name}`,
        subtitle: tagline,
        image,
        ctaText: "Shop Now",
        ctaLink: "#services",
      },
      {
        type: "services",
        heading: "What We Offer",
        items: [
          { title: "Quality Products", description: "Carefully selected, always fresh.", icon: "star" },
          { title: "Fast Delivery", description: "Same-day delivery across the city.", icon: "truck" },
          { title: "Great Support", description: "We're here to help, every day.", icon: "heart" },
        ],
      },
      {
        type: "contact",
        heading: "Get in Touch",
        email: `hello@${name.toLowerCase().replace(/\s+/g, "")}.sl`,
        phone: "+232 76 000 000",
        address: "Freetown, Sierra Leone",
      },
      {
        type: "footer",
        text: `© 2026 ${name}. All rights reserved.`,
        links: [
          { label: "Home", url: "#" },
          { label: "Services", url: "#services" },
          { label: "Contact", url: "#contact" },
        ],
      },
    ],
  }
}

async function seedMerchant(opts: {
  email: string
  name: string
  businessName: string
  flotMerchantId: string
  tagline: string
  heroImage: string
}) {
  const passwordHash = await bcrypt.hash("admin123", 12)

  const merchant = await db.merchant.upsert({
    where: { email: opts.email },
    update: {},
    create: {
      email: opts.email,
      passwordHash,
      name: opts.name,
      businessName: opts.businessName,
      type: "WEBSITE",
      flotMerchantId: opts.flotMerchantId,
      webhookUsername: opts.flotMerchantId.slice(0, 8),
      webhookPassword: "webhook-secret",
    },
  })

  const content = homeContent(opts.businessName, opts.tagline, opts.heroImage)

  // Published homepage
  await db.cmsPage.upsert({
    where: { merchantId_slug: { merchantId: merchant.id, slug: "home" } },
    update: {},
    create: {
      merchantId: merchant.id,
      slug: "home",
      title: "Homepage",
      draftContent: content,
      publishedContent: content,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  })

  // Draft about page (demonstrates draft vs published state)
  await db.cmsPage.upsert({
    where: { merchantId_slug: { merchantId: merchant.id, slug: "about" } },
    update: {},
    create: {
      merchantId: merchant.id,
      slug: "about",
      title: "About",
      draftContent: {
        blocks: [
          { type: "about", heading: "About Us", text: `${opts.businessName} has served the community for years.`, image: "" },
        ],
      },
      status: "DRAFT",
    },
  })

  return merchant
}

async function main() {
  const m1 = await seedMerchant({
    email: "demo@flotme.ai",
    name: "Demo Merchant",
    businessName: "Demo Store",
    flotMerchantId: "00000000-0000-0000-0000-000000000001",
    tagline: "Fresh goods, fast delivery across Freetown.",
    heroImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80",
  })

  const m2 = await seedMerchant({
    email: "client2@flotme.ai",
    name: "Aminata Kamara",
    businessName: "Lumley Boutique",
    flotMerchantId: "00000000-0000-0000-0000-000000000002",
    tagline: "Modern fashion, made in Sierra Leone.",
    heroImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  })

  console.log("✅ Seeded 2 client merchants, each with a published site:\n")
  for (const [m, id] of [[m1, "001"], [m2, "002"]] as const) {
    console.log(`   ${m.businessName}`)
    console.log(`     login:     ${m.email}  /  admin123`)
    console.log(`     live site: /site/${m.flotMerchantId}/home`)
    console.log(`     api:       /api/public/cms/${m.flotMerchantId}/home\n`)
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
