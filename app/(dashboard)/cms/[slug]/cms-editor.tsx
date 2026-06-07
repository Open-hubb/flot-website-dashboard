"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Globe,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Loader2,
  GripVertical,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  type ContentBlock,
  type PageContent,
  type ServiceItem,
  type FooterLink,
  BLOCK_LABELS,
} from "@/lib/cms-types"

interface MediaItem {
  id: string
  url: string
  filename: string
}

interface CmsEditorProps {
  slug: string
  title: string
  initialContent: PageContent
  status: "DRAFT" | "PUBLISHED"
  publishedAt: string | null
  flotMerchantId: string
  media: MediaItem[]
}

export function CmsEditor({
  slug,
  title: initialTitle,
  initialContent,
  status: initialStatus,
  publishedAt,
  flotMerchantId,
  media,
}: CmsEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialContent.blocks)
  const [status, setStatus] = useState(initialStatus)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [showMediaPicker, setShowMediaPicker] = useState<string | null>(null)
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null)
  const hasChanges = useRef(false)

  const saveDraft = useCallback(async () => {
    setSaving(true)
    setSaveMessage("")
    try {
      const res = await fetch(`/api/cms/pages/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, draftContent: { blocks } }),
      })
      if (res.ok) {
        setStatus("DRAFT")
        setSaveMessage("Draft saved")
        hasChanges.current = false
        setTimeout(() => setSaveMessage(""), 3000)
      }
    } finally {
      setSaving(false)
    }
  }, [slug, title, blocks])

  const publish = async () => {
    await saveDraft()
    setPublishing(true)
    try {
      const res = await fetch(`/api/cms/pages/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      })
      if (res.ok) {
        setStatus("PUBLISHED")
        setSaveMessage("Published!")
        setTimeout(() => setSaveMessage(""), 3000)
        router.refresh()
      }
    } finally {
      setPublishing(false)
    }
  }

  // Autosave on changes
  useEffect(() => {
    if (!hasChanges.current) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      saveDraft()
    }, 5000)
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [blocks, title, saveDraft])

  const markChanged = () => {
    hasChanges.current = true
  }

  const updateBlock = (index: number, updated: ContentBlock) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)))
    markChanged()
  }

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock = createDefaultBlock(type)
    setBlocks((prev) => [...prev, newBlock])
    markChanged()
  }

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index))
    markChanged()
  }

  const selectMedia = (url: string) => {
    setShowMediaPicker(null)
    return url
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Edit: {title}</h1>
            <p className="text-xs text-muted-foreground">/{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="text-xs text-emerald-600 font-medium animate-in fade-in">
              {saveMessage}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === "PUBLISHED"
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-amber-500/10 text-amber-700"
            }`}
          >
            {status === "PUBLISHED" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {status === "PUBLISHED" ? "Published" : "Draft"}
          </span>
          {status === "PUBLISHED" && (
            <a
              href={`/site/${flotMerchantId}/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View live
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save Draft
          </Button>
          <Button size="sm" onClick={publish} disabled={publishing || saving}>
            {publishing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Globe className="mr-1.5 h-3.5 w-3.5" />
            )}
            Publish
          </Button>
        </div>
      </div>

      {/* Page title */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <Label htmlFor="page-title" className="text-sm font-medium">
          Page Title
        </Label>
        <Input
          id="page-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            markChanged()
          }}
          className="mt-2"
          placeholder="Page title"
        />
      </div>

      {/* Content blocks */}
      {blocks.map((block, index) => (
        <div key={index} className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-sm font-semibold">{BLOCK_LABELS[block.type]}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeBlock(index)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="p-6 space-y-4">
            <BlockEditor
              block={block}
              onChange={(updated) => updateBlock(index, updated)}
              media={media}
              showMediaPicker={showMediaPicker}
              setShowMediaPicker={setShowMediaPicker}
              onSelectMedia={selectMedia}
            />
          </div>
        </div>
      ))}

      {/* Add block */}
      <div className="rounded-xl border border-dashed bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-3">Add a section</p>
        <div className="flex flex-wrap gap-2">
          {(["hero", "about", "services", "contact", "footer"] as const).map((type) => (
            <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {BLOCK_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function BlockEditor({
  block,
  onChange,
  media,
  showMediaPicker,
  setShowMediaPicker,
  onSelectMedia,
}: {
  block: ContentBlock
  onChange: (block: ContentBlock) => void
  media: MediaItem[]
  showMediaPicker: string | null
  setShowMediaPicker: (id: string | null) => void
  onSelectMedia: (url: string) => string
}) {
  switch (block.type) {
    case "hero":
      return (
        <HeroEditor
          block={block}
          onChange={onChange}
          media={media}
          showMediaPicker={showMediaPicker}
          setShowMediaPicker={setShowMediaPicker}
          onSelectMedia={onSelectMedia}
        />
      )
    case "about":
      return (
        <AboutEditor
          block={block}
          onChange={onChange}
          media={media}
          showMediaPicker={showMediaPicker}
          setShowMediaPicker={setShowMediaPicker}
          onSelectMedia={onSelectMedia}
        />
      )
    case "services":
      return <ServicesEditor block={block} onChange={onChange} />
    case "contact":
      return <ContactEditor block={block} onChange={onChange} />
    case "footer":
      return <FooterEditor block={block} onChange={onChange} />
  }
}

function ImageField({
  label,
  value,
  fieldId,
  onChange,
  media,
  showMediaPicker,
  setShowMediaPicker,
  onSelectMedia,
}: {
  label: string
  value: string
  fieldId: string
  onChange: (url: string) => void
  media: MediaItem[]
  showMediaPicker: string | null
  setShowMediaPicker: (id: string | null) => void
  onSelectMedia: (url: string) => string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL"
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setShowMediaPicker(showMediaPicker === fieldId ? null : fieldId)}
        >
          <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
          Browse
        </Button>
      </div>
      {value && (
        <div className="mt-2 relative w-full max-w-xs">
          {/* Merchants paste arbitrary image URLs; next/image domain allow-listing
              doesn't apply, so a plain <img> is intentional here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="rounded-lg border object-cover h-32 w-full"
          />
        </div>
      )}
      {showMediaPicker === fieldId && (
        <div className="mt-2 rounded-lg border bg-muted/50 p-3 max-h-48 overflow-y-auto">
          {media.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No media uploaded yet.{" "}
              <Link href="/cms/media" className="text-primary underline">
                Upload images
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {media.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onChange(onSelectMedia(m.url))}
                  className="group relative rounded-md overflow-hidden border hover:ring-2 hover:ring-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={m.filename}
                    className="h-16 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HeroEditor({
  block,
  onChange,
  media,
  showMediaPicker,
  setShowMediaPicker,
  onSelectMedia,
}: any) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm">Title</Label>
          <Input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Welcome to Our Store"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Subtitle</Label>
          <Input
            value={block.subtitle}
            onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
            placeholder="The best products in town"
          />
        </div>
      </div>
      <ImageField
        label="Hero Image"
        value={block.image}
        fieldId={`hero-image`}
        onChange={(url) => onChange({ ...block, image: url })}
        media={media}
        showMediaPicker={showMediaPicker}
        setShowMediaPicker={setShowMediaPicker}
        onSelectMedia={onSelectMedia}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm">CTA Text</Label>
          <Input
            value={block.ctaText}
            onChange={(e) => onChange({ ...block, ctaText: e.target.value })}
            placeholder="Get Started"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">CTA Link</Label>
          <Input
            value={block.ctaLink}
            onChange={(e) => onChange({ ...block, ctaLink: e.target.value })}
            placeholder="/products"
          />
        </div>
      </div>
    </>
  )
}

function AboutEditor({
  block,
  onChange,
  media,
  showMediaPicker,
  setShowMediaPicker,
  onSelectMedia,
}: any) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm">Heading</Label>
        <Input
          value={block.heading}
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
          placeholder="About Us"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Text</Label>
        <textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Tell visitors about your business..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <ImageField
        label="Image"
        value={block.image}
        fieldId={`about-image`}
        onChange={(url) => onChange({ ...block, image: url })}
        media={media}
        showMediaPicker={showMediaPicker}
        setShowMediaPicker={setShowMediaPicker}
        onSelectMedia={onSelectMedia}
      />
    </>
  )
}

function ServicesEditor({
  block,
  onChange,
}: {
  block: ContentBlock & { type: "services" }
  onChange: (b: ContentBlock) => void
}) {
  const addItem = () => {
    onChange({
      ...block,
      items: [...block.items, { title: "", description: "", icon: "star" }],
    })
  }

  const updateItem = (i: number, updated: ServiceItem) => {
    onChange({
      ...block,
      items: block.items.map((item, idx) => (idx === i ? updated : item)),
    })
  }

  const removeItem = (i: number) => {
    onChange({
      ...block,
      items: block.items.filter((_, idx) => idx !== i),
    })
  }

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm">Heading</Label>
        <Input
          value={block.heading}
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
          placeholder="Our Services"
        />
      </div>
      <div className="space-y-3">
        <Label className="text-sm">Service Items</Label>
        {block.items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start rounded-lg border bg-muted/30 p-3">
            <div className="flex-1 grid gap-2 sm:grid-cols-3">
              <Input
                value={item.title}
                onChange={(e) => updateItem(i, { ...item, title: e.target.value })}
                placeholder="Service name"
              />
              <Input
                value={item.description}
                onChange={(e) => updateItem(i, { ...item, description: e.target.value })}
                placeholder="Short description"
                className="sm:col-span-2"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(i)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Service
        </Button>
      </div>
    </>
  )
}

function ContactEditor({
  block,
  onChange,
}: {
  block: ContentBlock & { type: "contact" }
  onChange: (b: ContentBlock) => void
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm">Heading</Label>
        <Input
          value={block.heading}
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
          placeholder="Get in Touch"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm">Email</Label>
          <Input
            value={block.email}
            onChange={(e) => onChange({ ...block, email: e.target.value })}
            placeholder="hello@business.com"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Phone</Label>
          <Input
            value={block.phone}
            onChange={(e) => onChange({ ...block, phone: e.target.value })}
            placeholder="+232 76 123 456"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Address</Label>
        <textarea
          value={block.address}
          onChange={(e) => onChange({ ...block, address: e.target.value })}
          placeholder="123 Main Street, Freetown"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </>
  )
}

function FooterEditor({
  block,
  onChange,
}: {
  block: ContentBlock & { type: "footer" }
  onChange: (b: ContentBlock) => void
}) {
  const addLink = () => {
    onChange({
      ...block,
      links: [...block.links, { label: "", url: "" }],
    })
  }

  const updateLink = (i: number, updated: FooterLink) => {
    onChange({
      ...block,
      links: block.links.map((l, idx) => (idx === i ? updated : l)),
    })
  }

  const removeLink = (i: number) => {
    onChange({
      ...block,
      links: block.links.filter((_, idx) => idx !== i),
    })
  }

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm">Footer Text</Label>
        <textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="© 2026 Your Business. All rights reserved."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="space-y-3">
        <Label className="text-sm">Footer Links</Label>
        {block.links.map((link, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={link.label}
              onChange={(e) => updateLink(i, { ...link, label: e.target.value })}
              placeholder="Link label"
              className="flex-1"
            />
            <Input
              value={link.url}
              onChange={(e) => updateLink(i, { ...link, url: e.target.value })}
              placeholder="/page-url"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeLink(i)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addLink}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Link
        </Button>
      </div>
    </>
  )
}

function createDefaultBlock(type: ContentBlock["type"]): ContentBlock {
  switch (type) {
    case "hero":
      return { type: "hero", title: "", subtitle: "", image: "", ctaText: "", ctaLink: "" }
    case "about":
      return { type: "about", heading: "", text: "", image: "" }
    case "services":
      return { type: "services", heading: "", items: [] }
    case "contact":
      return { type: "contact", heading: "", email: "", phone: "", address: "" }
    case "footer":
      return { type: "footer", text: "", links: [] }
  }
}
