import { headers } from "next/headers"
import { notFound } from "next/navigation"
import type {
  ContentBlock,
  HeroBlock,
  AboutBlock,
  ServicesBlock,
  ContactBlock,
  FooterBlock,
} from "@/lib/cms-types"

// This page is a REFERENCE consumer of the public CMS API. It demonstrates
// how a headless client website renders content. It talks ONLY to the public
// API over HTTP — no database access, no auth — exactly like a real client site.

export const dynamic = "force-dynamic"

async function fetchPage(merchantId: string, slug: string) {
  const h = await headers()
  const host = h.get("host")
  const protocol = h.get("x-forwarded-proto") ?? "http"
  const base = `${protocol}://${host}`

  const res = await fetch(`${base}/api/public/cms/${merchantId}/${slug}`, {
    cache: "no-store",
  })

  if (!res.ok) return null
  return res.json() as Promise<{
    title: string
    slug: string
    blocks: { blocks: ContentBlock[] }
    publishedAt: string
  }>
}

export default async function SitePage({
  params,
}: {
  params: { merchantId: string; slug: string }
}) {
  const { merchantId, slug } = params
  const data = await fetchPage(merchantId, slug)

  if (!data) notFound()

  const blocks = data.blocks?.blocks ?? []

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Banner indicating this is the live published site */}
      <div className="bg-neutral-900 text-white text-center text-xs py-2 px-4">
        Live published site · rendered from{" "}
        <code className="text-emerald-400">/api/public/cms/{merchantId}/{slug}</code>
      </div>

      {blocks.length === 0 && (
        <div className="py-32 text-center text-neutral-400">
          This page has no published content yet.
        </div>
      )}

      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </main>
  )
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "hero":
      return <Hero block={block} />
    case "about":
      return <About block={block} />
    case "services":
      return <Services block={block} />
    case "contact":
      return <Contact block={block} />
    case "footer":
      return <Footer block={block} />
    default:
      return null
  }
}

function Hero({ block }: { block: HeroBlock }) {
  return (
    <section className="relative overflow-hidden">
      {block.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        className={`relative px-6 py-32 text-center ${
          block.image ? "bg-black/50 text-white" : "bg-neutral-50"
        }`}
      >
        {block.title && (
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {block.title}
          </h1>
        )}
        {block.subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">{block.subtitle}</p>
        )}
        {block.ctaText && (
          <a
            href={block.ctaLink || "#"}
            className="mt-8 inline-block rounded-lg bg-[#51bdce] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            {block.ctaText}
          </a>
        )}
      </div>
    </section>
  )
}

function About({ block }: { block: AboutBlock }) {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <div>
          {block.heading && <h2 className="text-3xl font-bold">{block.heading}</h2>}
          {block.text && (
            <p className="mt-4 whitespace-pre-line text-neutral-600 leading-relaxed">
              {block.text}
            </p>
          )}
        </div>
        {block.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.image}
            alt=""
            className="rounded-2xl object-cover w-full aspect-[4/3]"
          />
        )}
      </div>
    </section>
  )
}

function Services({ block }: { block: ServicesBlock }) {
  return (
    <section className="bg-neutral-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {block.heading && (
          <h2 className="text-center text-3xl font-bold">{block.heading}</h2>
        )}
        {block.items.length > 0 && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((item, i) => (
              <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Contact({ block }: { block: ContactBlock }) {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        {block.heading && <h2 className="text-3xl font-bold">{block.heading}</h2>}
        <div className="mt-6 space-y-2 text-neutral-600">
          {block.email && <p>{block.email}</p>}
          {block.phone && <p>{block.phone}</p>}
          {block.address && <p className="whitespace-pre-line">{block.address}</p>}
        </div>
      </div>
    </section>
  )
}

function Footer({ block }: { block: FooterBlock }) {
  return (
    <footer className="bg-neutral-900 px-6 py-12 text-neutral-300">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
        {block.links.length > 0 && (
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            {block.links.map((link, i) => (
              <a key={i} href={link.url || "#"} className="hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
        )}
        {block.text && <p className="text-xs text-neutral-500">{block.text}</p>}
      </div>
    </footer>
  )
}
