export interface HeroBlock {
  type: "hero"
  title: string
  subtitle: string
  image: string
  ctaText: string
  ctaLink: string
}

export interface AboutBlock {
  type: "about"
  heading: string
  text: string
  image: string
}

export interface ServiceItem {
  title: string
  description: string
  icon: string
}

export interface ServicesBlock {
  type: "services"
  heading: string
  items: ServiceItem[]
}

export interface ContactBlock {
  type: "contact"
  heading: string
  email: string
  phone: string
  address: string
}

export interface FooterLink {
  label: string
  url: string
}

export interface FooterBlock {
  type: "footer"
  text: string
  links: FooterLink[]
}

export type ContentBlock = HeroBlock | AboutBlock | ServicesBlock | ContactBlock | FooterBlock

export interface PageContent {
  blocks: ContentBlock[]
}

export const DEFAULT_PAGES: { slug: string; title: string; defaultBlocks: ContentBlock[] }[] = [
  {
    slug: "home",
    title: "Homepage",
    defaultBlocks: [
      { type: "hero", title: "", subtitle: "", image: "", ctaText: "", ctaLink: "" },
      { type: "services", heading: "Our Services", items: [] },
    ],
  },
  {
    slug: "about",
    title: "About",
    defaultBlocks: [
      { type: "about", heading: "About Us", text: "", image: "" },
    ],
  },
  {
    slug: "services",
    title: "Services",
    defaultBlocks: [
      { type: "services", heading: "What We Offer", items: [] },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    defaultBlocks: [
      { type: "contact", heading: "Get in Touch", email: "", phone: "", address: "" },
      { type: "footer", text: "", links: [] },
    ],
  },
]

export const BLOCK_LABELS: Record<ContentBlock["type"], string> = {
  hero: "Hero Section",
  about: "About Section",
  services: "Services Section",
  contact: "Contact Section",
  footer: "Footer Section",
}
