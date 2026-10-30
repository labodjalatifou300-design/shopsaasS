'use client'

import { useEffect, useState } from 'react'
import ConfirmationModal from '@/components/ConfirmationModal'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Store, Plus, ExternalLink, Edit3, Globe, ShoppingBag,
  CheckCircle, Clock, EyeOff, ArrowLeft, Eye, Trash2, Zap,
} from 'lucide-react'

function statusConfig(isPublished: boolean) {
  return isPublished
    ? { label: 'En ligne', bg: 'bg-emerald-500', dot: 'bg-emerald-400', text: 'text-white', icon: CheckCircle }
    : { label: 'Brouillon', bg: 'bg-zinc-400', dot: 'bg-zinc-300', text: 'text-white', icon: Clock }
}

const CARD_GRADIENTS = [
  'from-violet-400 via-purple-500 to-indigo-600',
  'from-rose-400 via-pink-500 to-fuchsia-600',
  'from-amber-400 via-orange-500 to-red-500',
  'from-teal-400 via-cyan-500 to-blue-600',
  'from-lime-400 via-emerald-500 to-green-600',
  'from-sky-400 via-blue-500 to-indigo-600',
]

interface Page {
  id: string
  title: string
  slug: string
  is_published: boolean
  created_at: string
  builder_json?: any
}

export default function BoutiquesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [pages, setPages] = useState<Page[]>([])
  const [parentStoreName, setParentStoreName] = useState('')
  const [parentStoreId, setParentStoreId] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageToDelete, setPageToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { fetchPages() }, [])

  async function fetchPages() {
    setLoading(true)
    const urlParams = new URLSearchParams(window.location.search)
    const parentId = urlParams.get('parent')
    if (!parentId) { setLoading(false); return }

    setParentStoreId(parentId)

    // Charger le nom de la boutique parente
    const { data: store } = await supabase
      .from('stores').select('name').eq('id', parentId).maybeSingle()
    if (store) setParentStoreName(store.name)

    // Charger toutes les pages de cette boutique (sauf 'home')
    const { data: storePages } = await supabase
      .from('store_pages')
      .select('id, title, slug, is_published, created_at, builder_json')
      .eq('store_id', parentId)
      .neq('slug', 'home')
      .order('created_at', { ascending: false })

    setPages(storePages || [])
    setLoading(false)
  }

  async function handleConfirmDelete() {
    if (!pageToDelete) return
    setDeleting(pageToDelete)
    await supabase.from('store_pages').delete().eq('id', pageToDelete)
    setPages(prev => prev.filter(p => p.id !== pageToDelete))
    setDeleting(null); setPageToDelete(null)
  }

  async function togglePublish(page: Page) {
    const newStatus = !page.is_published
    await supabase.from('store_pages').update({ is_published: newStatus }).eq('id', page.id)
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_published: newStatus } : p))
  }

  function getParentId() {
    return new URLSearchParams(window.location.search).get('parent') || ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Chargement…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <ConfirmationModal
        isOpen={!!pageToDelete}
        onClose={() => setPageToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer la page ?"
        message="Cette action est irréversible. La page et tout son contenu seront supprimés définitivement."
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        variant="danger"
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-zinc-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-violet-600" />
                Pages Produits
              </h1>
              {parentStoreName && (
                <p className="text-xs text-zinc-400 mt-0.5">
                  Boutique : <span className="font-semibold text-violet-600">{parentStoreName}</span>
                  <span className="ml-2 text-zinc-300">· Commandes dans le même dashboard</span>
                </p>
              )}
            </div>
          </div>
          <button onClick={() => router.push(`/boutiques/nouvelle?parent=${getParentId()}`)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-violet-200">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle page</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats */}
        {pages.length > 0 && (
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                <Store className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900">{pages.length}</p>
                <p className="text-xs text-zinc-400">page{pages.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900">{pages.filter(p => p.is_published).length}</p>
                <p className="text-xs text-zinc-400">en ligne</p>
              </div>
            </div>
          </div>
        )}

        {/* Vide */}
        {pages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-violet-200">
                <ShoppingBag className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center shadow-md">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Aucune page encore</h2>
            <p className="text-sm text-zinc-500 max-w-sm mb-8 leading-relaxed">
              Crée une page produit avec le thème de ton choix. Chaque page partage le marché et les produits de ta boutique.
            </p>
            <button onClick={() => router.push(`/boutiques/nouvelle?parent=${getParentId()}`)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-200">
              <Plus className="w-4 h-4" /> Créer ma première page
            </button>
          </div>
        )}

        {/* Grille */}
        {pages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pages.map((page, idx) => {
              const sc = statusConfig(page.is_published)
              const StatusIcon = sc.icon
              const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]

              // Extraire image preview du builder_json
              let heroImage: string | null = null
              if (page.builder_json) {
                const bj = page.builder_json
                heroImage = bj.template?.find((b: any) => b.settings?.images?.[0])?.settings?.images?.[0]
                  ?? bj.themeSettings?.logo_url ?? null
              }

              return (
                <div key={page.id}
                  className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-zinc-200/60 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                  onClick={() => router.push(`/boutiques/page/${page.id}`)}>

                  <div className={`relative h-40 bg-gradient-to-br ${gradient} overflow-hidden`}>
                    {heroImage ? (
                      <img src={heroImage} alt={page.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <Globe className="w-10 h-10 text-white/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text} shadow-sm`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
                      {sc.label}
                    </div>
                  </div>

                  <div className="p-3.5">
                    <h3 className="font-bold text-zinc-900 truncate text-sm">{page.title}</h3>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">/s/{page.slug}</p>
                    <div className="mt-3 flex gap-1.5">
                      <button onClick={e => { e.stopPropagation(); router.push(`/boutiques/page/${page.id}`) }}
                        className="flex-1 flex items-center justify-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold py-2 rounded-lg transition-colors">
                        <Edit3 className="w-3 h-3" /> Éditer
                      </button>
                      <button onClick={e => { e.stopPropagation(); window.open(`/s/${page.slug}`, '_blank') }}
                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-2 rounded-lg transition-colors">
                        <ExternalLink className="w-3 h-3" /> Voir
                      </button>
                      <button onClick={e => { e.stopPropagation(); togglePublish(page) }}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${page.is_published ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}`}
                        title={page.is_published ? 'Dépublier' : 'Publier'}>
                        {page.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); setPageToDelete(page.id) }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors"
                        title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Nouvelle page */}
            <button onClick={() => router.push(`/boutiques/nouvelle?parent=${getParentId()}`)}
              className="group relative bg-white rounded-2xl border-2 border-dashed border-zinc-300 hover:border-violet-400 hover:bg-violet-50/30 transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[240px]">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-700 group-hover:text-violet-700 transition-colors">Nouvelle page</p>
                <p className="text-xs text-zinc-400 mt-0.5">Nouveau thème, même boutique</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
