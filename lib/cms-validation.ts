import { z } from "zod"

const heroBlock = z.object({
  type: z.literal("hero"),
  title: z.string().max(200),
  subtitle: z.string().max(300),
  image: z.string().max(2000),
  ctaText: z.string().max(100),
  ctaLink: z.string().max(2000),
})

const aboutBlock = z.object({
  type: z.literal("about"),
  heading: z.string().max(200),
  text: z.string().max(5000),
  image: z.string().max(2000),
})

const serviceItem = z.object({
  title: z.string().max(200),
  description: z.string().max(1000),
  icon: z.string().max(100),
})

const servicesBlock = z.object({
  type: z.literal("services"),
  heading: z.string().max(200),
  items: z.array(serviceItem).max(50),
})

const contactBlock = z.object({
  type: z.literal("contact"),
  heading: z.string().max(200),
  email: z.string().max(320),
  phone: z.string().max(50),
  address: z.string().max(500),
})

const footerLink = z.object({
  label: z.string().max(100),
  url: z.string().max(2000),
})

const footerBlock = z.object({
  type: z.literal("footer"),
  text: z.string().max(1000),
  links: z.array(footerLink).max(30),
})

const contentBlock = z.discriminatedUnion("type", [
  heroBlock,
  aboutBlock,
  servicesBlock,
  contactBlock,
  footerBlock,
])

export const pageContentSchema = z.object({
  blocks: z.array(contentBlock).max(20),
})

export const savePageSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  draftContent: pageContentSchema,
})

export const publishSchema = z.object({
  action: z.literal("publish"),
})

export const deleteMediaSchema = z.object({
  id: z.string().min(1),
})

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  price: z.number().min(0),
  currency: z.string().max(10).optional(),
  image: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(50).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
})
