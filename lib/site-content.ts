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
export const siteContentSchema = z.object({
  hero: z.object({ badge: s(), title: s(), subtitle: s(), ctaText: s(), ctaLink: s() }).default(EMPTY_CONTENT.hero),
  about: z.object({
    eyebrow: s(), title: s(), body: s(), image: s(),
    stats: z.array(z.object({ value: s(), label: s() })).default([]),
  }).default(EMPTY_CONTENT.about),
  services: z.array(z.object({ title: s(), subtitle: s(), items: z.array(z.string()).default([]) })).default([]),
  testimonials: z.array(z.object({ name: s(), role: s(), quote: s() })).default([]),
  contact: z.object({
    address: s(), addressLink: s(), phone: s(), email: s(), hours: s(), whatsapp: s(), instagram: s(), mapEmbed: s(),
  }).default(EMPTY_CONTENT.contact),
  footer: z.object({ tagline: s(), email: s(), instagram: s() }).default(EMPTY_CONTENT.footer),
  marquee: z.object({ primary: z.array(z.string()).default([]), secondary: z.array(z.string()).default([]) }).default(EMPTY_CONTENT.marquee),
})

// Ensure a stored value (possibly partial / older shape) has every key.
export function withDefaults(value: unknown): SiteContentData {
  const v = (value ?? {}) as Partial<SiteContentData>
  return {
    hero: { ...EMPTY_CONTENT.hero, ...v.hero },
    about: { ...EMPTY_CONTENT.about, ...v.about, stats: v.about?.stats ?? [] },
    services: v.services ?? [],
    testimonials: v.testimonials ?? [],
    contact: { ...EMPTY_CONTENT.contact, ...v.contact },
    footer: { ...EMPTY_CONTENT.footer, ...v.footer },
    marquee: { ...EMPTY_CONTENT.marquee, ...v.marquee },
  }
}
