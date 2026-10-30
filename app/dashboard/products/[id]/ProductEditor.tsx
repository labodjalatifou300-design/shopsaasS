'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ImagePlus, Save, X } from 'lucide-react'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Field, Input, Select, buttonClass } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { saveSimpleProduct } from '../product-actions'

export type EditorInitial = {
  title: string
  description: string
  status: 'active' | 'draft'
  images: string[]
  price: string
  compareAt: string
  stock: string
}

const MAX_MEDIA = 10
const MAX_MB = 50

export function ProductEditor({
  storeId,
  productId,
  initial,
  currency,
  hasMarket,
  canEdit,
}: {
  storeId: string
  productId: string
  initial: EditorInitial
  currency: string
  hasMarket: boolean
  canEdit: boolean
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [status, setStatus] = useState(initial.status)
  const [images, setImages] = useState<string[]>(initial.images)
  const [price, setPrice] = useState(initial.price)
  const [compareAt, setCompareAt] = useState(initial.compareAt)
  const [stock, setStock] = useState(initial.stock)
  const [uploading, setUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const disabled = !canEdit || pending

  async function uploadMedia(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setFeedback(null)
    const supabase = createClient()
    const added: string[] = []
    for (const file of Array.from(files).slice(0, MAX_MEDIA - images.length)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue
      if (file.size > MAX_MB * 1024 * 1024) {
        setFeedback({ ok: false, text: `${file.name} dépasse ${MAX_MB} Mo.` })
        continue
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${storeId}/products/${productId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('store-assets').upload(path, file, { cacheControl: '31536000' })
      if (error) {
        setFeedback({ ok: false, text: 'Envoi impossible. Vérifie tes droits d’accès.' })
        continue
      }
      added.push(supabase.storage.from('store-assets').getPublicUrl(path).data.publicUrl)
    }
    setImages((prev) => [...prev, ...added])
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev]
      const j = index + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }

  function save() {
    setFeedback(null)
    const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))
    startTransition(async () => {
      const res = await saveSimpleProduct(productId, {
        title,
        description,
        status,
        images,
        price: num(price),
        compareAt: num(compareAt),
        stock: Math.trunc(Number(stock) || 0),
      })
      if ('error' in res) {
        setFeedback({ ok: false, text: res.error })
        return
      }
      setFeedback({ ok: true, text: 'Produit enregistré.' })
      router.refresh()
    })
  }

  const inputCls = 'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-zinc-50'

  return (
    <div className="space-y-6 pb-28">
      {/* 1. Titre + description */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <Field label="Titre">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={disabled} placeholder="Ex : T-shirt à manches courtes" />
        </Field>
        <div className="mt-5 space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Description</span>
          <RichTextEditor value={description} onChange={setDescription} disabled={disabled} storeId={storeId} folder={`products/${productId}`} />
        </div>
      </section>

      {/* 2. Prix : prix actuel et prix barré côte à côte */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">Prix</h2>
        {!hasMarket && <p className="mb-3 text-xs text-amber-700">Ajoute d’abord un marché pour définir un prix.</p>}
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Prix actuel (${currency})`}>
            <input type="number" min="0" step="any" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} disabled={disabled || !hasMarket} className={inputCls} placeholder="0" />
          </Field>
          <Field label={`Prix avant réduction (${currency})`}>
            <input type="number" min="0" step="any" inputMode="decimal" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} disabled={disabled || !hasMarket} className={`${inputCls} text-zinc-400 line-through`} placeholder="0" />
          </Field>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Le prix avant réduction s’affiche barré sur la boutique.</p>
      </section>

      {/* 3. Galerie : première photo grande, les suivantes plus petites */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">Médias</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <div key={src} className={`group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 ${i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}`}>
              {/\.(mp4|webm|mov)(\?|$)/i.test(src) ? (
                <video src={src} className="size-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="size-full object-cover" />
              )}
              {i === 0 && <span className="absolute left-2 top-2 rounded-md bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-white">Principale</span>}
              {canEdit && (
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md bg-white/90 p-1.5 disabled:opacity-30" aria-label="Déplacer avant"><ArrowLeft className="size-3.5" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded-md bg-white/90 p-1.5 disabled:opacity-30" aria-label="Déplacer après"><ArrowRight className="size-3.5" /></button>
                  </div>
                  <button type="button" onClick={() => setImages((p) => p.filter((_, k) => k !== i))} className="rounded-md bg-white/90 p-1.5 text-red-600" aria-label="Retirer"><X className="size-3.5" /></button>
                </div>
              )}
            </div>
          ))}
          {canEdit && images.length < MAX_MEDIA && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 text-xs font-medium text-zinc-500 hover:border-violet-400 hover:text-violet-600 disabled:opacity-60"
            >
              <ImagePlus className="size-5" />
              {uploading ? 'Envoi…' : 'Ajouter depuis mon PC'}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => uploadMedia(e.target.files)} />
      </section>

      {/* 4. Quantité en stock (diminue à chaque commande) */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <Field label="Quantité disponible" hint="Ce stock diminue automatiquement à chaque commande validée.">
          <input type="number" min="0" step="1" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} disabled={disabled} className={`${inputCls} max-w-[220px]`} />
        </Field>
      </section>

      {/* 5. Statut */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <Field label="Statut">
          <Select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'draft')} disabled={disabled} className="max-w-[260px]">
            <option value="active">Actif</option>
            <option value="draft">Brouillon</option>
          </Select>
        </Field>
      </section>

      {canEdit && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur md:left-64">
          <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
            {feedback && <p className={`mr-auto text-sm ${feedback.ok ? 'text-emerald-700' : 'text-red-600'}`}>{feedback.text}</p>}
            <button type="button" onClick={save} disabled={pending || uploading} className={buttonClass('primary')}>
              <Save className="size-4" />
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
