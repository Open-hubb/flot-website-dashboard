"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Upload,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"

interface MediaItem {
  id: string
  url: string
  filename: string
  type: string
  size: number
  createdAt: string
}

export function MediaLibrary({ initialMedia }: { initialMedia: MediaItem[] }) {
  const router = useRouter()
  const [media, setMedia] = useState(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/cms/media", {
          method: "POST",
          body: formData,
        })

        if (res.ok) {
          const item = await res.json()
          setMedia((prev) => [
            { ...item, createdAt: item.createdAt ?? new Date().toISOString() },
            ...prev,
          ])
        }
      }
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  const handleDelete = async (item: MediaItem) => {
    setDeleting(item.id)
    try {
      const res = await fetch("/api/cms/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      })
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== item.id))
        if (selected?.id === item.id) setSelected(null)
      }
    } finally {
      setDeleting(null)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Media Library</h1>
            <p className="text-xs text-muted-foreground">{media.length} files</p>
          </div>
        </div>
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-3.5 w-3.5" />
            )}
            Upload Images
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1">
          {media.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-16 text-center">
              <ImageIcon className="mb-4 h-10 w-10 text-muted-foreground opacity-40" />
              <h2 className="text-base font-semibold">No media uploaded</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload images to use in your website pages.
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => fileInput.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload your first image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {media.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`group relative rounded-xl border overflow-hidden bg-card shadow-sm hover:ring-2 hover:ring-primary transition-all ${
                    selected?.id === item.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="aspect-square">
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{item.filename}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(item.size)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 rounded-xl border bg-card shadow-sm p-4 space-y-4 self-start sticky top-6">
            <img
              src={selected.url}
              alt={selected.filename}
              className="w-full rounded-lg border object-cover"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium truncate">{selected.filename}</p>
              <p className="text-xs text-muted-foreground">{formatSize(selected.size)}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(selected.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={selected.url}
                  readOnly
                  className="flex-1 rounded-md border bg-muted px-2 py-1 text-xs"
                />
                <CopyButton value={selected.url} />
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => handleDelete(selected)}
              disabled={deleting === selected.id}
            >
              {deleting === selected.id ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
