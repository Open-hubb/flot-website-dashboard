import { z } from "zod"

// The editable shape of a merchant's whole-site content. Generic enough for
// the marketing sites (hero, about, services, testimonials, contact, footer,
// marquee). Each site reads only the parts it uses.
export interface SiteContentData {
  hero: { badge: string; title: string; subtitle: string; ctaText: string; ctaLink: string }
  about: { eyebrow: string; title: string; body: string; image: string; stats: { value: string; label: string }[] }
  services: { title: string; subtitle: string; items: string[] }[]
  testimonials: { name: string; role: string; quote: string }[]
  contact: { address: string; addressLink: string; phone: string; email: string; hours: string; whatsapp: string; instagram: string; mapEmbed: string }
  footer: { tagline: string; email: string; instagram: string }
  marquee: { primary: string[]; secondary: string[] }
}

export const EMPTY_CONTENT: SiteContentData = {
  hero: { badge: "", title: "", subtitle: "", ctaText: "", ctaLink: "" },
  about: { eyebrow: "", title: "", body: "", image: "", stats: [] },
  services: [],
  testimonials: [],
  contact: { address: "", addressLink: "", phone: "", email: "", hours: "", whatsapp: "", instagram: "", mapEmbed: "" },
  footer: { tagline: "", email: "", instagram: "" },
  marquee: { primary: [], secondary: [] },
}

const s = () => z.string().default("")
const statSchema = z.object({ value: s(), label: s() })
const heroSchema = z.object({ badge: s(), title: s(), subtitle: s(), ctaText: s(), ctaLink: s() })
const aboutSchema = z.object({ eyebrow: s(), title: s(), body: s(), image: s() })
const serviceSchema = z.object({ title: s(), subtitle: s(), items: z.array(z.string()).default([]) })
const testimonialSchema = z.object({ name: s(), role: s(), quote: s() })
const contactSchema = z.object({
  address: s(), addressLink: s(), phone: s(), email: s(), hours: s(), whatsapp: s(), instagram: s(), mapEmbed: s(),
})
const footerSchema = z.object({ tagline: s(), email: s(), instagram: s() })
const marqueeSchema = z.object({ primary: z.array(z.string()).default([]), secondary: z.array(z.string()).default([]) })

export const siteContentSchema = z.object({
  hero: heroSchema.default(EMPTY_CONTENT.hero),
  about: aboutSchema.extend({ stats: z.array(statSchema).default([]) }).default(EMPTY_CONTENT.about),
  services: z.array(serviceSchema).default([]),
  testimonials: z.array(testimonialSchema).default([]),
  contact: contactSchema.default(EMPTY_CONTENT.contact),
  footer: footerSchema.default(EMPTY_CONTENT.footer),
  marquee: marqueeSchema.default(EMPTY_CONTENT.marquee),
})

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function parseObject<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : fallback
}

function parseArray<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const parsed = schema.safeParse(item)
    return parsed.success ? [parsed.data] : []
  })
}

// Ensure a stored value (possibly partial / older shape) has every key.
export function withDefaults(value: unknown): SiteContentData {
  const v = asRecord(value)
  const about = asRecord(v.about)
  const marquee = asRecord(v.marquee)
  return {
    hero: parseObject(heroSchema, v.hero, { ...EMPTY_CONTENT.hero }),
    about: {
      ...parseObject(aboutSchema, v.about, { ...EMPTY_CONTENT.about }),
      stats: parseArray(statSchema, about.stats),
    },
    services: parseArray(serviceSchema, v.services),
    testimonials: parseArray(testimonialSchema, v.testimonials),
    contact: parseObject(contactSchema, v.contact, { ...EMPTY_CONTENT.contact }),
    footer: parseObject(footerSchema, v.footer, { ...EMPTY_CONTENT.footer }),
    marquee: {
      primary: parseArray(z.string(), marquee.primary),
      secondary: parseArray(z.string(), marquee.secondary),
    },
  }
}
