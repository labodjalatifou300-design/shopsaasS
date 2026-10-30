'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileImage, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MAX_MB = 5

/** Envoie les images dans Supabase Storage (bucket store-assets/<store_id>/...) */
export function ImageUploader({
  storeId,
  folder,
  images,
  onChange,
  max = 10,
  disabled,
}: {
  storeId: string
  folder: string
  images: string[]
  onChange: (images: string[]) => void
  max?: number
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setUploading(true)
    const supabase = createClient()
    const urls: string[] = []
    for (const file of Array.from(files).slice(0, max - images.length)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`${file.name} dépasse ${MAX_MB} Mo.`)
        continue
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${storeId}/${folder}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('store-assets').upload(path, file, { cacheControl: '31536000' })
      if (upErr) {
        setError('Envoi impossible. Vérifie tes droits.')
        continue
      }
      urls.push(supabase.storage.from('store-assets').getPublicUrl(path).data.publicUrl)
    }
    onChange([...images, ...urls])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...images]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {images.map((url, i) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            {/\.(mp4|webm|mov)(\?|$)/i.test(url) ? <video src={url} className="size-full object-cover" muted /> : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="size-full object-cover" />
            )}
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">Principale</span>}
            {!disabled && (
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="rounded-md bg-white/90 p-1" title="Avant">
                    <ArrowLeft className="size-3" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="rounded-md bg-white/90 p-1" title="Après">
                    <ArrowRight className="size-3" />
                  </button>
                </div>
                <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} className="rounded-md bg-white/90 p-1 text-red-600" title="Retirer">
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        {!disabled && images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 text-xs text-zinc-500 transition hover:border-violet-400 hover:text-violet-600"
          >
            <FileImage className="size-5" />
            {uploading ? 'Envoi…' : 'Ajouter un média'}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple={max > 1} hidden onChange={(e) => upload(e.target.files)} />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
