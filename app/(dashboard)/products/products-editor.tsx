"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2, Upload, Copy, Check } from "lucide-react"
import { APP_URL } from "@/lib/app-url"

export interface ProductInput {
  id: string
  name: string
  price: number
  currency: string
  image: string
  category: string
  description: string
  badge: string
  order: number
  active: boolean
}

const EMPTY: ProductInput = {
  id: "",
  name: "",
  price: 0,
  currency: "SLE",
  image: "",
  category: "",
  description: "",
  badge: "",
  order: 0,
  active: true,
}

export function ProductsEditor({
  flotMerchantId,
  initialProducts,
}: {
  flotMerchantId: string
  initialProducts: ProductInput[]
}) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [draft, setDraft] = useState<ProductInput | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const apiUrl = `${APP_URL}/api/public/products/${flotMerchantId}`

  function openNew() {
    setError("")
    setDraft({ ...EMPTY, order: products.length })
  }
  function openEdit(p: ProductInput) {
    setError("")
    setDraft({ ...p })
  }

  async function refresh() {
    const res = await fetch("/api/cms/products")
    if (res.ok) setProducts(await res.json().then((rows) =>
      rows.map((p: Record<string, unknown>) => ({
        ...p,
        price: Number(p.price),
        image: p.image ?? "",
        category: p.category ?? "",
        description: p.description ?? "",
        badge: p.badge ?? "",
      }))
    ))
  }

  async function save() {
    if (!draft) return
    if (!draft.name.trim()) { setError("Name is required."); return }
    setSaving(true)
    setError("")
    const payload = {
      name: draft.name,
      price: Number(draft.price) || 0,
      currency: draft.currency || "SLE",
      image: draft.image,
      category: draft.category,
      description: draft.description,
      badge: draft.badge,
      order: Number(draft.order) || 0,
      active: draft.active,
    }
    const res = await fetch(
      draft.id ? `/api/cms/products/${draft.id}` : "/api/cms/products",
      {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )
    setSaving(false)
    if (res.ok) {
      setDraft(null)
      await refresh()
      router.refresh()
    } else {
      setError("Couldn't save. Check the fields and try again.")
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return
    const res = await fetch(`/api/cms/products/${id}`, { method: "DELETE" })
    if (res.ok) {
      setProducts((ps) => ps.filter((p) => p.id !== id))
      router.refresh()
    }
  }

  async function uploadImage(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/cms/media", { method: "POST", body: fd })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setDraft((d) => (d ? { ...d, image: url } : d))
    } else {
      setError("Image upload failed.")
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"} · edits go live on your website
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Add product
        </Button>
      </div>

      {/* Public API hint */}
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="shrink-0 font-medium text-foreground">Your website reads from:</span>
        <code className="flex-1 truncate font-mono">{apiUrl}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(apiUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="shrink-0 rounded p-1 hover:bg-muted"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
          No products yet. Click <span className="font-medium text-foreground">Add product</span> to create your first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="group rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="aspect-[4/3] bg-muted">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-tight">{p.name}</p>
                  {p.badge && (
                    <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">{p.badge}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{p.category}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold">{p.currency} {p.price.toLocaleString()}</span>
                  <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="rounded p-1.5 hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(p.id, p.name)} className="rounded p-1.5 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                  </div>
                </div>
                {!p.active && <p className="text-[10px] text-muted-foreground">Hidden from website</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>

          {draft && (
            <div className="space-y-3 py-1 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="p-name">Name</Label>
                  <Input id="p-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-price">Price</Label>
                  <Input id="p-price" type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-currency">Currency</Label>
                  <Input id="p-currency" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-category">Category</Label>
                  <Input id="p-category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-badge">Badge (optional)</Label>
                  <Input id="p-badge" placeholder="Popular, New…" value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="p-desc">Description</Label>
                  <textarea id="p-desc" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Image</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 rounded-md border bg-muted overflow-hidden">
                      {draft.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={draft.image} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Input placeholder="Image URL" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Upload
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input id="p-active" type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                  <Label htmlFor="p-active" className="cursor-pointer">Show on website</Label>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {draft?.id ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
