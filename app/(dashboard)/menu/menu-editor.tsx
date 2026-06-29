"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MenuContentData, MenuSection, MenuItem, MenuGroup, MenuVariant } from "@/lib/menu-content"
import { Loader2, Plus, Trash2, Check, Copy, ChevronDown, Eye, X, ExternalLink } from "lucide-react"

// Confirm before any destructive delete (guards against mis-clicks).
function confirmDelete(what: string) {
  return typeof window === "undefined" || window.confirm(`Delete ${what}? This can't be undone.`)
}

/* ---------- small building blocks ---------- */

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

// Flot-managed field — shown for transparency but not editable by the merchant.
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      <Input value={value} readOnly disabled className="cursor-not-allowed opacity-70" />
    </div>
  )
}

/* ---------- live preview: the REAL site in an iframe, fed unsaved edits ---------- */

// Embeds the merchant's actual menu site and streams the current (unsaved) menu
// to it via postMessage, so the preview is pixel-identical to production —
// real colors, fonts, collapsible categories, everything.
function PreviewFrame({ siteUrl, menu }: { siteUrl: string; menu: MenuContentData }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const origin = useMemo(() => { try { return new URL(siteUrl).origin } catch { return "" } }, [siteUrl])

  const post = useCallback(() => {
    const w = ref.current?.contentWindow
    if (w && origin) w.postMessage({ source: "flot-dashboard", type: "menu-preview", menu }, origin)
  }, [menu, origin])

  // Push the latest menu (debounced) whenever it changes.
  useEffect(() => {
    const t = setTimeout(post, 250)
    return () => clearTimeout(t)
  }, [post])

  // Reply to the site's "ready" handshake so it gets the draft even if it
  // finished loading before our first push.
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
      <iframe
        ref={ref}
        src={siteUrl}
        title="Menu preview"
        onLoad={post}
        className="h-[calc(100vh-9rem)] w-full bg-white"
      />
    </div>
  )
}

/* ---------- one menu item row (memoized) ---------- */

const ItemRow = memo(function ItemRow({
  item, onChange, onRemove,
}: { item: MenuItem; onChange: (it: MenuItem) => void; onRemove: () => void }) {
  const variants = item.variants ?? []
  const setVariant = (idx: number, v: MenuVariant) => onChange({ ...item, variants: variants.map((x, j) => (j === idx ? v : x)) })
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="flex gap-2">
        <Input className="flex-1" placeholder="Item name" value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} />
        {variants.length === 0 && (
          <Input className="w-24" placeholder="Price" inputMode="decimal" value={String(item.price ?? "")} onChange={(e) => onChange({ ...item, price: e.target.value === "" ? 0 : Number(e.target.value) || 0 })} />
        )}
        <Input className="w-20" placeholder="No." value={item.itemNumber} onChange={(e) => onChange({ ...item, itemNumber: e.target.value })} />
        <button onClick={() => { if (confirmDelete(`item "${item.name || "untitled"}"`)) onRemove() }} className="shrink-0 rounded-md border px-2 hover:bg-muted" title="Remove item">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
      <textarea rows={2} placeholder="Description" value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      <div className="flex gap-2">
        <Input className="flex-1" placeholder="Sub-header (optional)" value={item.subHeader ?? ""} onChange={(e) => onChange({ ...item, subHeader: e.target.value || null })} />
        <Input className="flex-1" placeholder="Tags (comma-separated)" value={(item.tags ?? []).join(", ")} onChange={(e) => onChange({ ...item, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
      </div>
      {/* Variants (e.g. Shot / Bottle) — when present, they replace the single price */}
      {variants.length > 0 && (
        <div className="space-y-1.5 rounded-md border border-dashed p-2">
          <Label className="text-[11px] text-muted-foreground">Price options</Label>
          {variants.map((v, vi) => (
            <div key={vi} className="flex gap-2">
              <Input className="flex-1" placeholder="Label (e.g. Shot)" value={v.label} onChange={(e) => setVariant(vi, { ...v, label: e.target.value })} />
              <Input className="w-24" placeholder="Price" inputMode="decimal" value={String(v.price ?? "")} onChange={(e) => setVariant(vi, { ...v, price: e.target.value === "" ? 0 : Number(e.target.value) || 0 })} />
              <button onClick={() => onChange({ ...item, variants: variants.filter((_, j) => j !== vi) })} className="shrink-0 rounded-md border px-2 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
            </div>
          ))}
          <button onClick={() => onChange({ ...item, variants: [...variants, { label: "", price: 0 }] })} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="h-3 w-3" /> Add option</button>
        </div>
      )}
      {variants.length === 0 && (
        <button onClick={() => onChange({ ...item, variants: [{ label: "", price: item.price || 0 }] })} className="text-[11px] font-medium text-primary hover:underline">+ Use price options (Shot / Bottle…)</button>
      )}
    </div>
  )
})

/* ---------- one section card (memoized) ---------- */

const SectionCard = memo(function SectionCard({
  section, groups, updateSection, removeSection,
}: {
  section: MenuSection
  groups: MenuGroup[]
  updateSection: (id: string, updater: (s: MenuSection) => MenuSection) => void
  removeSection: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const groupLabel = groups.find((g) => g.id === section.groupId)?.label

  const setItem = useCallback((idx: number, it: MenuItem) => {
    updateSection(section.id, (s) => ({ ...s, items: s.items.map((x, j) => (j === idx ? it : x)) }))
  }, [section.id, updateSection])

  const removeItem = useCallback((idx: number) => {
    updateSection(section.id, (s) => ({ ...s, items: s.items.filter((_, j) => j !== idx) }))
  }, [section.id, updateSection])

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-2 text-left">
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="font-medium">{section.title || "Untitled section"}</span>
          {groupLabel && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{groupLabel}</span>}
          <span className="text-xs text-muted-foreground">· {section.items.length} items</span>
        </button>
        <button onClick={() => { if (confirmDelete(`section "${section.title || "untitled"}" and its ${section.items.length} items`)) removeSection(section.id) }} className="shrink-0 rounded-md border px-2 py-1 hover:bg-muted" title="Remove section">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t px-4 py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Field label="Section title" value={section.title} onChange={(v) => updateSection(section.id, (s) => ({ ...s, title: v }))} />
            <div className="space-y-1.5">
              <Label>Group</Label>
              <select value={section.groupId} onChange={(e) => updateSection(section.id, (s) => ({ ...s, groupId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">— none —</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Sort</Label>
              <Input className="w-20" inputMode="numeric" value={String(section.sortOrder ?? 0)} onChange={(e) => updateSection(section.id, (s) => ({ ...s, sortOrder: Number(e.target.value) || 0 }))} />
            </div>
          </div>

          <Field label="Section image URL (optional)" value={section.image ?? ""} onChange={(v) => updateSection(section.id, (s) => ({ ...s, image: v }))} placeholder="https://…" />

          <div className="space-y-2">
            {section.items.map((it, i) => (
              <ItemRow key={i} item={it} onChange={(next) => setItem(i, next)} onRemove={() => removeItem(i)} />
            ))}
            <button onClick={() => updateSection(section.id, (s) => ({ ...s, items: [...s.items, { name: "", price: 0, description: "", itemNumber: "", tags: [], subHeader: null, variants: [] }] }))}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add item
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

/* ---------- main editor ---------- */

export function MenuEditor({ flotMerchantId, siteUrl, initialContent }: { flotMerchantId: string; siteUrl?: string; initialContent: MenuContentData }) {
  const router = useRouter()
  const [menu, setMenu] = useState<MenuContentData>(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [brandingOpen, setBrandingOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)

  const updateSection = useCallback((id: string, updater: (s: MenuSection) => MenuSection) => {
    setMenu((m) => ({ ...m, sections: m.sections.map((s) => (s.id === id ? updater(s) : s)) }))
  }, [])

  const removeSection = useCallback((id: string) => {
    setMenu((m) => ({ ...m, sections: m.sections.filter((s) => s.id !== id) }))
  }, [])

  const setBranding = (k: keyof MenuContentData["branding"], v: string) =>
    setMenu((m) => ({ ...m, branding: { ...m.branding, [k]: v } }))

  const totalItems = useMemo(() => menu.sections.reduce((n, s) => n + s.items.length, 0), [menu.sections])

  async function save() {
    setSaving(true); setError(""); setSaved(false)
    const res = await fetch("/api/cms/menu", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(menu),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000) }
    else setError("Couldn't save. Please try again.")
  }

  function addGroup() {
    const id = `group-${Date.now()}`
    setMenu((m) => ({ ...m, groups: [...m.groups, { id, label: "", sortOrder: m.groups.length }] }))
  }
  function addSection() {
    const id = `section-${Date.now()}`
    setMenu((m) => ({ ...m, sections: [...m.sections, { id, title: "", groupId: m.groups[0]?.id ?? "", sortOrder: m.sections.length, image: "", items: [] }] }))
  }

  return (
    <div className="xl:flex xl:items-start xl:gap-6">
      {/* ---------- editor column ---------- */}
      <div className="min-w-0 flex-1 space-y-5 xl:max-w-3xl">
        {/* Header / save */}
        <div className="sticky top-0 z-20 -mx-6 flex items-center justify-between gap-3 border-b bg-background/90 px-6 py-3 backdrop-blur">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Menu</h2>
            <p className="truncate text-xs text-muted-foreground">{menu.sections.length} sections · {totalItems} items — changes go live after you save</p>
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

        {/* Live menu URL */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
          <span className="shrink-0 font-medium text-foreground">Your live menu:</span>
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

        {/* Branding */}
        <div className="rounded-xl border bg-card shadow-sm">
          <button onClick={() => setBrandingOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4 text-left">
            <div>
              <h3 className="font-semibold">Branding &amp; header</h3>
              <p className="text-xs text-muted-foreground">Restaurant name, logo, phone</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${brandingOpen ? "rotate-180" : ""}`} />
          </button>
          {brandingOpen && (
            <div className="space-y-4 border-t px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Restaurant name" value={menu.branding.restaurantName} onChange={(v) => setBranding("restaurantName", v)} />
                <Field label="Subtitle" value={menu.branding.subtitle} onChange={(v) => setBranding("subtitle", v)} />
                <Field label="Phone" value={menu.branding.phone} onChange={(v) => setBranding("phone", v)} />
                <Field label="TIN number" value={menu.branding.tinNumber} onChange={(v) => setBranding("tinNumber", v)} />
                <Field label="Currency" value={menu.branding.currency} onChange={(v) => setBranding("currency", v)} />
                <Field label="Logo URL" value={menu.branding.logoUrl} onChange={(v) => setBranding("logoUrl", v)} />
              </div>
              <div className="space-y-3 rounded-lg border border-dashed bg-muted/20 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Managed by Flot — read-only</p>
                <div className="grid grid-cols-2 gap-3">
                  <ReadOnlyField label="Checkout URL (Flot pay link)" value={menu.branding.checkoutUrl} />
                  <ReadOnlyField label="OG image URL" value={menu.branding.ogImageUrl} />
                  <ReadOnlyField label="Footer text" value={menu.branding.footerText} />
                  <ReadOnlyField label="Footer link text" value={menu.branding.footerLinkText} />
                  <ReadOnlyField label="Footer link URL" value={menu.branding.footerLinkUrl} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Groups */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="px-5 py-4">
            <h3 className="font-semibold">Menu groups</h3>
            <p className="text-xs text-muted-foreground">Top-level tabs (e.g. Food, Drinks). Sections belong to a group.</p>
          </div>
          <div className="space-y-2 border-t px-5 py-4">
            {menu.groups.map((g, i) => (
              <div key={g.id} className="flex gap-2">
                <Input placeholder="Group label" value={g.label} onChange={(e) => setMenu((m) => ({ ...m, groups: m.groups.map((x, j) => j === i ? { ...x, label: e.target.value } : x) }))} />
                <Input className="w-20" inputMode="numeric" placeholder="Sort" value={String(g.sortOrder ?? 0)} onChange={(e) => setMenu((m) => ({ ...m, groups: m.groups.map((x, j) => j === i ? { ...x, sortOrder: Number(e.target.value) || 0 } : x) }))} />
                <button onClick={() => { if (confirmDelete(`the "${g.label || "untitled"}" group`)) setMenu((m) => ({ ...m, groups: m.groups.filter((_, j) => j !== i) })) }} className="shrink-0 rounded-md border px-2 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
              </div>
            ))}
            <button onClick={addGroup} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Add group</button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sections &amp; items</h3>
            <button onClick={addSection} className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"><Plus className="h-3.5 w-3.5" /> Add section</button>
          </div>
          {menu.sections.map((sec) => (
            <SectionCard key={sec.id} section={sec} groups={menu.groups} updateSection={updateSection} removeSection={removeSection} />
          ))}
        </div>

        <div className="flex justify-end pb-8">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : null}
            {saved ? "Saved" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* ---------- preview: side panel on xl ---------- */}
      <aside className="hidden w-[400px] shrink-0 xl:sticky xl:top-4 xl:block">
        <PreviewFrame siteUrl={siteUrl ?? ""} menu={menu} />
      </aside>

      {/* ---------- preview: overlay on smaller screens ---------- */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 xl:hidden" onClick={() => setPreviewOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-background p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Preview</h3>
              <button onClick={() => setPreviewOpen(false)} className="rounded-md border p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <PreviewFrame siteUrl={siteUrl ?? ""} menu={menu} />
          </div>
        </div>
      )}
    </div>
  )
}
