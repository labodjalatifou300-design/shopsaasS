'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getThemesForPicker } from '@/lib/store-builder/boutique-themes'
import { ArrowLeft, Check, Sparkles, X } from 'lucide-react'

const THEMES = getThemesForPicker()

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
}

interface ProductRow { id: string; title?: string; images?: string[] }

export const dynamic = 'force-dynamic'

export default function NouvelleBoutiquePage() {
  const router = useRouter()
  const supabase = createClient()

  const [selectedTheme, setSelectedTheme] = useState(THEMES[0].id)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Boutique parente passée en query param
  const parentId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('parent')
    : null

  useEffect(() => {
    if (!parentId) return
    // Charger les produits de la boutique parente
    supabase.from('products').select('id, title, images')
      .eq('store_id', parentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }).limit(12)
      .then(({ data }) => setProducts(data || []))
  }, [parentId])

  function handleNameChange(val: string) {
    setName(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  async function handleCreate() {
    if (!name.trim()) { setError('Le nom est requis.'); return }
    if (!slug.trim()) { setError("L'adresse est requise."); return }
    if (!parentId) { setError('Boutique parente introuvable. Reviens au dashboard.'); return }

    setCreating(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { setError('Session expirée.'); setCreating(false); return }

      const res = await fetch('/api/pages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: parentId,
          name: name.trim(),
          slug: slug.trim(),
          theme_id: selectedTheme,
          product_id: selectedProductId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Erreur.'); setCreating(false); return }

      // Rediriger vers l'éditeur de la page créée
      router.push(`/boutiques/page/${data.data.id}`)
    } catch (e: any) { setError(e.message); setCreating(false) }
  }

  const currentTheme = THEMES.find(t => t.id === selectedTheme)!

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Topbar */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push(parentId ? `/boutiques?parent=${parentId}` : '/boutiques')}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h1 className="text-sm font-bold text-zinc-800">Nouvelle page produit</h1>
        <button onClick={handleCreate} disabled={creating || !name.trim() || !slug.trim()}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all">
          <Sparkles className="w-4 h-4" />
          {creating ? 'Création…' : 'Créer'}
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* Thèmes */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Choisir un thème</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map(t => {
              const active = selectedTheme === t.id
              return (
                <button key={t.id} type="button" onClick={() => setSelectedTheme(t.id)}
                  className={`relative text-left rounded-xl border-2 overflow-hidden transition-all ${active ? 'border-violet-500 shadow-lg shadow-violet-100' : 'border-zinc-200 hover:border-zinc-300 bg-white'}`}>
                  <div className="relative h-28">
                    <Image src={t.preview_image} alt={t.name} fill className="object-cover object-top" sizes="200px" />
                    {active && (
                      <div className="absolute inset-0 bg-violet-600/10 flex items-center justify-center">
                        <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs font-bold text-zinc-800 truncate">{t.name}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[t.preview_color, t.default_colors.accent, t.default_colors.bg].map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Produit */}
          {products.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Produit principal <span className="text-zinc-300 font-normal">(optionnel)</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {products.map(p => {
                  const active = selectedProductId === p.id
                  return (
                    <button key={p.id} type="button" onClick={() => setSelectedProductId(active ? null : p.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${active ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}`}>
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="w-6 h-6 rounded-lg object-cover" />}
                      <span className="max-w-[120px] truncate">{p.title || 'Produit'}</span>
                      {active && <X className="w-3 h-3 text-violet-400" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm">
            <div className="relative h-32">
              <Image src={currentTheme.preview_image} alt={currentTheme.name} fill className="object-cover object-top" sizes="320px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute top-2 right-2 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {currentTheme.name}
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-zinc-500 leading-relaxed">{currentTheme.description}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Nom de la page *</label>
              <input value={name} onChange={e => handleNameChange(e.target.value)}
                placeholder="Ex: Détox Foie Premium"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Adresse *</label>
              <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
                <span className="px-3 py-2.5 text-xs text-zinc-400 bg-zinc-50 border-r border-zinc-200">/s/</span>
                <input value={slug} onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true) }}
                  placeholder="ma-page" className="flex-1 px-3 py-2.5 text-sm outline-none" />
              </div>
              <p className="text-xs text-zinc-400 mt-1">Chaque page a sa propre URL publique.</p>
            </div>

            {!parentId && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                ⚠️ Accède à cette page depuis le dashboard de ta boutique → Pages produits.
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-700">
                <X className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button onClick={handleCreate} disabled={creating || !name.trim() || !slug.trim() || !parentId}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-sm shadow-violet-200">
              {creating
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Création…</>
                : <><Sparkles className="w-4 h-4" /> Créer la page</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
