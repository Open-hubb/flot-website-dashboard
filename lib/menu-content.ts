import { z } from "zod"

// A restaurant/bar digital menu. Mirrors the structure the menu sites already
// use (branding + groups + sections → items), so a site can fetch it from the
// dashboard's public API with no shape change.
export interface MenuItem {
  name: string
  price: number
  description: string
  itemNumber: string
  tags: string[]
  subHeader: string | null
}

export interface MenuSection {
  id: string
  title: string
  groupId: string
  sortOrder: number
  items: MenuItem[]
}

export interface MenuGroup {
  id: string
  label: string
  sortOrder: number
}

export interface MenuBranding {
  restaurantName: string
  subtitle: string
  tinNumber: string
  phone: string
  logoUrl: string
  checkoutUrl: string
  currency: string
  footerText: string
  footerLinkText: string
  footerLinkUrl: string
  ogImageUrl: string
}

export interface MenuContentData {
  version: number
  lastModified: string
  branding: MenuBranding
  groups: MenuGroup[]
  sections: MenuSection[]
}

export const EMPTY_BRANDING: MenuBranding = {
  restaurantName: "",
  subtitle: "",
  tinNumber: "",
  phone: "",
  logoUrl: "",
  checkoutUrl: "",
  currency: "LE",
  footerText: "",
  footerLinkText: "",
  footerLinkUrl: "",
  ogImageUrl: "",
}

export const EMPTY_MENU: MenuContentData = {
  version: 1,
  lastModified: "",
  branding: EMPTY_BRANDING,
  groups: [],
  sections: [],
}

const s = () => z.string().default("")
const n = () => z.coerce.number().default(0)

const itemSchema = z.object({
  name: s(),
  price: z.coerce.number().default(0),
  description: s(),
  itemNumber: s(),
  tags: z.array(z.string()).default([]),
  subHeader: z.string().nullable().default(null),
})

const sectionSchema = z.object({
  id: s(),
  title: s(),
  groupId: s(),
  sortOrder: n(),
  items: z.array(itemSchema).default([]),
})

const groupSchema = z.object({
  id: s(),
  label: s(),
  sortOrder: n(),
})

const brandingSchema = z
  .object({
    restaurantName: s(),
    subtitle: s(),
    tinNumber: s(),
    phone: s(),
    logoUrl: s(),
    checkoutUrl: s(),
    currency: z.string().default("LE"),
    footerText: s(),
    footerLinkText: s(),
    footerLinkUrl: s(),
    ogImageUrl: s(),
  })
  .default(EMPTY_BRANDING)

export const menuContentSchema = z.object({
  version: z.coerce.number().default(1),
  lastModified: s(),
  branding: brandingSchema,
  groups: z.array(groupSchema).default([]),
  sections: z.array(sectionSchema).default([]),
})

// Ensure a stored value (possibly partial / from the site's own JSON) has every
// key the editor and sites expect.
export function withMenuDefaults(value: unknown): MenuContentData {
  const v = (value ?? {}) as Partial<MenuContentData>
  return {
    version: typeof v.version === "number" ? v.version : 1,
    lastModified: v.lastModified ?? "",
    branding: { ...EMPTY_BRANDING, ...v.branding },
    groups: Array.isArray(v.groups) ? v.groups : [],
    sections: Array.isArray(v.sections) ? v.sections : [],
  }
}
