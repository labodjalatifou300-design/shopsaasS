'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getThemesForPicker } from '@/lib/store-builder/boutique-themes'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Package,
  Sparkles,
  Store,
} from 'lucide-react'
import { useStore } from '@/components/StoreProvider'

const THEMES = getThemesForPicker()

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
}

interface ProductRow {
  id: string
  title?: string
  price?: number
  currency?: string
  image_url?: string
}

export default function NouvelleBoutiquePage() {
  const router = useRouter()
  const { refreshStores } = useStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0].id)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (step !== 2) return
    setLoadingProducts(true)
    supabase
      .from('products')
      .select('id, title, price, currency, image_url')
      .order('created_at', { ascending: false })
      .then(({ data, error }: { data: ProductRow[] | null; error: any }) => {
        if (error) console.error("Error fetching products:", error);
        setProducts((data as ProductRow[]) || [])
        setLoadingProducts(false)
      })
  }, [step, supabase])

  function handleNameChange(val: string) {
    setName(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  function handleSlugChange(val: string) {
    setSlug(slugify(val))
    setSlugEdited(true)
  }

  function productLabel(p: ProductRow) {
    return p.title || 'Produit sans nom'
  }

  function productImage(p: ProductRow) {
    return p.image_url || null
  }

  async function createStore() {
    if (!name.trim()) { setError('Le nom de la page est requis.'); return }
    if (!slug.trim()) { setError('Le slug est requis.'); return }

    setCreating(true)
    setError('')

    try {
      // Obtenir le token de session pour l'API
      const { data: { session } } = await supabase.auth.getSession()
      let token = session?.access_token

      if (!token) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        token = refreshed?.session?.access_token
      }

      if (!token) {
        setError('Session expirée. Veuillez vous reconnecter.')
        setCreating(false)
        return
      }

      // Passer par l'API pour contourner les problèmes de RLS côté client
      const res = await fetch('/api/stores/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          theme_id: selectedTheme,
          product_id: selectedProductId || null
        })
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Erreur lors de la création de la boutique.')
        setCreating(false)
        return
      }

      const store = data.data

      try {
        if (refreshStores) await refreshStores()
      } catch (e) {
        console.error(e)
      }

      router.push(`/boutiques/${store.id}`)
    } catch (e: any) {
      setError(e.message || 'Erreur inattendue lors de la création.')
      setCreating(false)
    }
  }

  const selectedThemeData = THEMES.find(t => t.id === selectedTheme)
  const selectedProduct = products.find(p => p.id === selectedProductId)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="border-b px-6 py-4 flex items-center gap-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <button
          onClick={() => {
            if (step === 1) router.push('/boutiques')
            else setStep((step - 1) as 1 | 2)
          }}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: 'var(--text-faint)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-600" />
          <h1 className="font-semibold" style={{ color: 'var(--text)' }}>Nouvelle page produit</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {(['Thème', 'Produit', 'Infos'] as const).map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className="w-4 h-px hidden sm:block" style={{ background: 'var(--border)' }} />}
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                    step >= n ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span>{n}</span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* ÉTAPE 1 — Thème */}
        {step === 1 && (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Choisissez votre thème
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Quel style pour votre page produit ?
              </h2>
              <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-dim)' }}>
                Chaque thème inclut sections, couleurs et polices pré-configurées. Vous pourrez tout modifier ensuite.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all ${
                    selectedTheme === theme.id
                      ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                      : 'border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                  style={selectedTheme !== theme.id ? { background: 'var(--card)' } : undefined}
                >
                  <div className="relative h-48" style={{ background: 'var(--card-2)' }}>
                    <Image
                      src={theme.preview_image}
                      alt={theme.name}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {selectedTheme === theme.id && (
                      <div className="absolute top-3 right-3 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      {[theme.preview_color, theme.default_colors.accent, theme.default_colors.bg].map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border border-white/70 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-4" style={{ background: 'var(--card)' }}>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{theme.name}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{theme.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {theme.tags.map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-sm"
              >
                Continuer avec ce thème
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ÉTAPE 2 — Produit */}
        {step === 2 && (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <Package className="w-4 h-4" />
                Produit principal
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Pour quel produit créez-vous la page ?
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Le thème <strong>{selectedThemeData?.name}</strong> sera pré-rempli avec les infos de ce produit.
              </p>
            </div>

            {loadingProducts ? (
              <p className="text-center text-sm py-12" style={{ color: 'var(--text-faint)' }}>Chargement des produits…</p>
            ) : products.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-1">Aucun produit disponible</p>
                <p className="text-gray-400 text-sm mb-4">Ajoutez un produit d&apos;abord, ou continuez sans.</p>
                <button
                  type="button"
                  onClick={() => router.push('/produits/ajouter')}
                  className="text-indigo-600 text-sm font-medium hover:underline"
                >
                  Ajouter un produit →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {products.map(product => {
                  const img = productImage(product)
                  const selected = selectedProductId === product.id
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                      className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
                        selected ? 'border-indigo-500 shadow-md' : 'border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                      style={!selected ? { background: 'var(--card)' } : undefined}
                    >
                      <div className="h-32 bg-gray-50 flex items-center justify-center relative">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-10 h-10 text-gray-300" />
                        )}
                        {selected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{productLabel(product)}</p>
                        {product.price != null && (
                          <p className="text-xs text-indigo-600 mt-0.5">
                            {Number(product.price).toLocaleString('fr-FR')} {product.currency || 'FCFA'}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => { setSelectedProductId(null); setStep(3) }}
                className="px-6 py-3 rounded-xl border text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
              >
                Continuer sans produit
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!selectedProductId}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-sm"
              >
                Continuer
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ÉTAPE 3 — Infos boutique */}
        {step === 3 && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Nommez votre page produit</h2>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Ces informations peuvent être modifiées plus tard.</p>
            </div>

            <div className="max-w-lg mx-auto rounded-2xl border shadow-sm p-8" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mb-4">
                <div
                  className="w-8 h-8 rounded-lg shrink-0"
                  style={{ backgroundColor: selectedThemeData?.preview_color }}
                />
                <div className="min-w-0">
                  <p className="text-xs text-indigo-500 font-medium">Thème</p>
                  <p className="text-sm font-semibold text-indigo-900 truncate">{selectedThemeData?.name}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-indigo-500 hover:underline shrink-0">
                  Changer
                </button>
              </div>

              {selectedProduct && (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-6" style={{ background: 'var(--card-2)' }}>
                  {productImage(selectedProduct) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={productImage(selectedProduct)!} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-300" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>Produit</p>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{productLabel(selectedProduct)}</p>
                  </div>
                  <button type="button" onClick={() => setStep(2)} className="ml-auto text-xs text-indigo-500 hover:underline shrink-0">
                    Changer
                  </button>
                </div>
              )}

              <div className="mb-5">
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
                  Nom de la page <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Ex: Page Produit Beauté"
                  className="w-full px-4 py-3 rounded-xl border focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-colors"
                  style={{ background: 'var(--card-2)', color: 'var(--text)', borderColor: 'var(--border)' }}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
                  URL de la page <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100" style={{ borderColor: 'var(--border)' }}>
                  <span className="px-3 py-3 text-sm border-r" style={{ background: 'var(--card-2)', color: 'var(--text-faint)', borderColor: 'var(--border)' }}>/s/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="ma-page-produit"
                    className="flex-1 px-3 py-3 outline-none text-sm"
                    style={{ background: 'var(--card)', color: 'var(--text)' }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                  Accessible sur : <span className="font-mono text-indigo-500">/s/{slug || 'ma-page-produit'}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={createStore}
                  disabled={creating || !name.trim() || !slug.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Création…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Créer la page
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
