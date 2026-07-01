"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SiteContentData } from "@/lib/site-content"
import { Loader2, Plus, Trash2, Check, Copy, ChevronDown, Upload, Eye, X, ExternalLink } from "lucide-react"

// Confirm before any destructive delete (guards against mis-clicks).
function confirmDelete(what: string) {
  return typeof window === "undefined" || window.confirm(`Delete ${what}? This can't be undone.`)
}

/* ---------- small building blocks ---------- */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 border-t px-5 py-4">{children}</div>}
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function AreaField({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
    </div>
  )
}

// Editor for an array of plain strings (marquee words, service line items).
function StringList({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 rounded-md border px-2 hover:bg-muted">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ""])} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  )
}

/* ---------- live preview: the REAL site in an iframe, fed unsaved edits ---------- */

// Embeds the merchant's actual website and streams the current (unsaved) content
// to it via postMessage, so the preview is the real site — real design, exactly
// as visitors see it — reflecting edits live before saving.
function PreviewFrame({ siteUrl, content }: { siteUrl: string; content: SiteContentData }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const origin = useMemo(() => { try { return new URL(siteUrl).origin } catch { return "" } }, [siteUrl])

  const post = useCallback(() => {
    const w = ref.current?.contentWindow
    if (w && origin) w.postMessage({ source: "flot-dashboard", type: "site-content-preview", content }, origin)
  }, [content, origin])

  useEffect(() => { const t = setTimeout(post, 250); return () => clearTimeout(t) }, [post])
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (origin && e.origin === origin && e.data?.source === "flot-site" && e.data?.type === "preview-ready") post()
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [origin, post])

  if (!siteUrl) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-xs text-muted-foreground">
        Set the site URL to enable the live preview.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-2 text-[11px] font-medium text-muted-foreground">
        Live preview — your real site, showing unsaved changes
      </div>
      <iframe ref={ref} src={siteUrl} title="Site preview" onLoad={post} className="h-[calc(100vh-9rem)] w-full bg-white" />
    </div>
  )
}

/* ---------- main editor ---------- */

export function SiteContentEditor({ siteUrl, initialContent }: { siteUrl?: string; initialContent: SiteContentData }) {
  const router = useRouter()
  const [c, setC] = useState<SiteContentData>(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  async function save() {
    setSaving(true); setError(""); setSaved(false)
    const res = await fetch("/api/cms/site-content", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000) }
    else setError("Couldn't save. Please try again.")
  }

  async function uploadAboutImage(file: File) {
    setUploading(true)
    const fd = new FormData(); fd.append("file", file)
    const res = await fetch("/api/cms/media", { method: "POST", body: fd })
    setUploading(false)
    if (res.ok) { const { url } = await res.json(); setC((p) => ({ ...p, about: { ...p.about, image: url } })) }
  }

  return (
    <div className="xl:flex xl:items-start xl:gap-6">
      <div className="min-w-0 flex-1 space-y-5 xl:max-w-3xl">
      {/* Header / save */}
      <div className="sticky top-0 z-20 -mx-6 flex items-center justify-between gap-3 border-b bg-background/90 px-6 py-3 backdrop-blur">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Website Content</h2>
          <p className="truncate text-xs text-muted-foreground">Edit your site — changes go live after you save</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => setPreviewOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted xl:hidden">
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : null}
            {saved ? "Saved" : "Save changes"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
        <span className="shrink-0 font-medium text-foreground">Your website:</span>
        {siteUrl ? (
          <>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate font-medium text-primary hover:underline">{siteUrl}</a>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded p-1 hover:bg-muted" title="Open site"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /></a>
            <button onClick={() => { navigator.clipboard.writeText(siteUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="shrink-0 rounded p-1 hover:bg-muted" title="Copy link">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </>
        ) : (
          <span className="flex-1 truncate text-muted-foreground">website URL not set</span>
        )}
      </div>

      {/* Hero */}
      <Section title="Hero" subtitle="The top banner">
        <TextField label="Badge / eyebrow" value={c.hero.badge} onChange={(v) => setC({ ...c, hero: { ...c.hero, badge: v } })} />
        <TextField label="Title" value={c.hero.title} onChange={(v) => setC({ ...c, hero: { ...c.hero, title: v } })} />
        <AreaField label="Subtitle" value={c.hero.subtitle} onChange={(v) => setC({ ...c, hero: { ...c.hero, subtitle: v } })} rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Button text" value={c.hero.ctaText} onChange={(v) => setC({ ...c, hero: { ...c.hero, ctaText: v } })} />
          <TextField label="Button link" value={c.hero.ctaLink} onChange={(v) => setC({ ...c, hero: { ...c.hero, ctaLink: v } })} />
        </div>
      </Section>

      {/* About */}
      <Section title="About" subtitle="Your story + stats">
        <TextField label="Eyebrow" value={c.about.eyebrow} onChange={(v) => setC({ ...c, about: { ...c.about, eyebrow: v } })} />
        <TextField label="Heading" value={c.about.title} onChange={(v) => setC({ ...c, about: { ...c.about, title: v } })} />
        <AreaField label="Body" value={c.about.body} onChange={(v) => setC({ ...c, about: { ...c.about, body: v } })} rows={4} />
        <div className="space-y-1.5">
          <Label>Image</Label>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.about.image ? <img src={c.about.image} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <Input className="flex-1" placeholder="Image URL" value={c.about.image} onChange={(e) => setC({ ...c, about: { ...c.about, image: e.target.value } })} />
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAboutImage(f) }} />
            </label>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Stats</Label>
          {c.about.stats.map((st, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="300+" value={st.value} onChange={(e) => setC({ ...c, about: { ...c.about, stats: c.about.stats.map((x, j) => j === i ? { ...x, value: e.target.value } : x) } })} />
              <Input placeholder="Happy Clients" value={st.label} onChange={(e) => setC({ ...c, about: { ...c.about, stats: c.about.stats.map((x, j) => j === i ? { ...x, label: e.target.value } : x) } })} />
              <button onClick={() => { if (confirmDelete("this stat")) setC({ ...c, about: { ...c.about, stats: c.about.stats.filter((_, j) => j !== i) } }) }} className="shrink-0 rounded-md border px-2 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
            </div>
          ))}
          <button onClick={() => setC({ ...c, about: { ...c.about, stats: [...c.about.stats, { value: "", label: "" }] } })} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Add stat</button>
        </div>
      </Section>

      {/* Services */}
      <Section title="Services" subtitle="Service categories">
        {c.services.map((sv, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Service {i + 1}</span>
              <button onClick={() => { if (confirmDelete(`service "${sv.title || "untitled"}"`)) setC({ ...c, services: c.services.filter((_, j) => j !== i) }) }} className="rounded-md border px-2 py-1 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Title" value={sv.title} onChange={(e) => setC({ ...c, services: c.services.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} />
              <Input placeholder="Subtitle" value={sv.subtitle} onChange={(e) => setC({ ...c, services: c.services.map((x, j) => j === i ? { ...x, subtitle: e.target.value } : x) })} />
            </div>
            <StringList label="Items" items={sv.items} onChange={(items) => setC({ ...c, services: c.services.map((x, j) => j === i ? { ...x, items } : x) })} />
          </div>
        ))}
        <button onClick={() => setC({ ...c, services: [...c.services, { title: "", subtitle: "", items: [] }] })} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Add service</button>
      </Section>

      {/* Testimonials */}
      <Section title="Testimonials" subtitle="Customer reviews">
        {c.testimonials.map((t, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Review {i + 1}</span>
              <button onClick={() => { if (confirmDelete(`review from "${t.name || "untitled"}"`)) setC({ ...c, testimonials: c.testimonials.filter((_, j) => j !== i) }) }} className="rounded-md border px-2 py-1 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={t.name} onChange={(e) => setC({ ...c, testimonials: c.testimonials.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
              <Input placeholder="Role / where" value={t.role} onChange={(e) => setC({ ...c, testimonials: c.testimonials.map((x, j) => j === i ? { ...x, role: e.target.value } : x) })} />
            </div>
            <textarea rows={2} placeholder="Quote" value={t.quote} onChange={(e) => setC({ ...c, testimonials: c.testimonials.map((x, j) => j === i ? { ...x, quote: e.target.value } : x) })}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
        ))}
        <button onClick={() => setC({ ...c, testimonials: [...c.testimonials, { name: "", role: "", quote: "" }] })} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Add review</button>
      </Section>

      {/* Contact */}
      <Section title="Contact" subtitle="Address, phone, hours, socials">
        <TextField label="Address" value={c.contact.address} onChange={(v) => setC({ ...c, contact: { ...c.contact, address: v } })} />
        <TextField label="Map link (Google Maps)" value={c.contact.addressLink} onChange={(v) => setC({ ...c, contact: { ...c.contact, addressLink: v } })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Phone" value={c.contact.phone} onChange={(v) => setC({ ...c, contact: { ...c.contact, phone: v } })} />
          <TextField label="WhatsApp number" value={c.contact.whatsapp} onChange={(v) => setC({ ...c, contact: { ...c.contact, whatsapp: v } })} />
          <TextField label="Email" value={c.contact.email} onChange={(v) => setC({ ...c, contact: { ...c.contact, email: v } })} />
          <TextField label="Hours" value={c.contact.hours} onChange={(v) => setC({ ...c, contact: { ...c.contact, hours: v } })} />
        </div>
        <TextField label="Instagram URL" value={c.contact.instagram} onChange={(v) => setC({ ...c, contact: { ...c.contact, instagram: v } })} />
        <AreaField label="Map embed URL (Google Maps iframe src)" value={c.contact.mapEmbed} onChange={(v) => setC({ ...c, contact: { ...c.contact, mapEmbed: v } })} rows={2} />
      </Section>

      {/* Footer */}
      <Section title="Footer">
        <TextField label="Tagline" value={c.footer.tagline} onChange={(v) => setC({ ...c, footer: { ...c.footer, tagline: v } })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Email" value={c.footer.email} onChange={(v) => setC({ ...c, footer: { ...c.footer, email: v } })} />
          <TextField label="Instagram URL" value={c.footer.instagram} onChange={(v) => setC({ ...c, footer: { ...c.footer, instagram: v } })} />
        </div>
      </Section>

      {/* Marquee */}
      <Section title="Marquee strips" subtitle="Scrolling word strips">
        <StringList label="Primary strip" items={c.marquee.primary} onChange={(primary) => setC({ ...c, marquee: { ...c.marquee, primary } })} />
        <StringList label="Secondary strip" items={c.marquee.secondary} onChange={(secondary) => setC({ ...c, marquee: { ...c.marquee, secondary } })} />
      </Section>

      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : null}
          {saved ? "Saved" : "Save changes"}
        </Button>
      </div>
      </div>

      {/* preview: side panel on xl */}
      <aside className="hidden w-[400px] shrink-0 xl:sticky xl:top-4 xl:block">
        <PreviewFrame siteUrl={siteUrl ?? ""} content={c} />
      </aside>

      {/* preview: overlay on smaller screens */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 xl:hidden" onClick={() => setPreviewOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-background p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Preview</h3>
              <button onClick={() => setPreviewOpen(false)} className="rounded-md border p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <PreviewFrame siteUrl={siteUrl ?? ""} content={c} />
          </div>
        </div>
      )}
    </div>
  )
}
