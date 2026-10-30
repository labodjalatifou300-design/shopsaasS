'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, GripVertical, Monitor, MoveDown, MoveUp, Plus, Smartphone, Trash2 } from 'lucide-react'
import { Card, Field, Input, Select } from '@/components/ui'

// saveProductPage removed — use the store builder editor (/boutiques) instead
type PageSection = { id: string; type: string; visible?: boolean; settings?: Record<string, any> }

const starter = ['Bloc produit', 'Offres quantité', 'Formulaire de commande', 'Urgence', 'Bénéfices en icônes', 'Image + texte', 'Avis clients', 'Garantie', 'FAQ', 'Vidéo', 'Bandeau défilant', 'Bouton Commander collant']
const presets = [
  { label: 'Shrine conversion', sections: ['Bloc produit', 'Bénéfices en icônes', 'Avis clients', 'FAQ', 'Garantie'] },
  { label: 'Zenvyra éditorial', sections: ['Bloc produit', 'Image + texte', 'Vidéo', 'Avis clients', 'Bandeau défilant'] },
]

export function ThemeEditor({ products, selected, initialSections }: {
  products: { id: string; title: string; images: string[]; description: string }[]
  selected?: { id: string; title: string; images: string[]; description: string }
  initialSections: PageSection[]
}) {
  const [productId, setProductId] = useState(selected?.id ?? '')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [sections, setSections] = useState<PageSection[]>(
    initialSections.length
      ? initialSections
      : starter.map((type, i) => ({ id: `${type}-${i}`, type, visible: true, settings: {} }))
  )
  const [selectedId, setSelectedId] = useState(sections[0]?.id)
  const product = products.find((p) => p.id === productId) ?? selected
  const active = sections.find((s) => s.id === selectedId)

  function applyPreset(items: string[]) {
    setSections(items.map((type, i) => ({ id: `${type}-${Date.now()}-${i}`, type, visible: true, settings: {} })))
  }

  return (
    <div className="fixed inset-0 flex min-h-screen flex-col bg-zinc-100 md:pl-64">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100">← Dashboard</Link>
          <Eye className="size-5 text-violet-600" />
          <div>
            <h1 className="font-semibold">Éditeur de boutique</h1>
            <p className="hidden text-xs text-zinc-500 sm:block">Aperçu réel de la boutique publique, responsive mobile et ordinateur.</p>
          </div>
        </div>
        <Link href="/boutiques" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700">
          Ouvrir le nouvel éditeur →
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[300px] shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-4">
          <label className="mb-4 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Page produit</label>
          <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Choisir un produit</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </Select>

          <div className="mt-5 flex gap-2">
            {presets.map((preset) => (
              <button key={preset.label} onClick={() => applyPreset(preset.sections)}
                className="flex-1 rounded-lg bg-zinc-100 px-2 py-2 text-[11px] font-medium text-zinc-600 hover:bg-violet-50 hover:text-violet-700">
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Sections</h2>
              <p className="text-xs text-zinc-500">Réordonne avec les flèches.</p>
            </div>
            <button onClick={() => setSections([...sections, { id: `custom-${Date.now()}`, type: 'Image + texte', visible: true, settings: {} }])}
              className="rounded-lg p-2 text-violet-700 hover:bg-violet-50">
              <Plus className="size-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {sections.map((section, index) => (
              <div key={section.id}
                className={`flex items-center gap-2 rounded-xl border px-2 py-2 ${selectedId === section.id ? 'border-violet-400 bg-violet-50' : 'border-zinc-200'} ${!section.visible ? 'opacity-50' : ''}`}>
                <GripVertical className="size-4 text-zinc-400" />
                <button className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => setSelectedId(section.id)}>{section.type}</button>
                <button disabled={index === 0} onClick={() => setSections(items => items.map((item, i) => i === index - 1 ? items[index] : i === index ? items[index - 1] : item))} className="text-zinc-400 disabled:opacity-20"><MoveUp className="size-3.5" /></button>
                <button disabled={index === sections.length - 1} onClick={() => setSections(items => items.map((item, i) => i === index ? items[index + 1] : i === index + 1 ? items[index] : item))} className="text-zinc-400 disabled:opacity-20"><MoveDown className="size-3.5" /></button>
                <button onClick={() => setSections(items => items.filter(item => item.id !== section.id))} className="text-zinc-400 hover:text-red-600"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
          </div>

          {active && (
            <Card className="mt-5 space-y-3 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Réglages de section</p>
              <Field label="Titre">
                <Input placeholder="Titre optionnel" value={active.settings?.title ?? ''}
                  onChange={(e) => setSections(items => items.map(item => item.id === active.id ? { ...item, settings: { ...item.settings, title: e.target.value } } : item))} />
              </Field>
              <Field label="Texte">
                <Input placeholder="Message de la section" value={active.settings?.text ?? ''}
                  onChange={(e) => setSections(items => items.map(item => item.id === active.id ? { ...item, settings: { ...item.settings, text: e.target.value } } : item))} />
              </Field>
            </Card>
          )}
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 items-center justify-center gap-2 border-b border-zinc-200 bg-white">
            <button onClick={() => setDevice('desktop')} className={`rounded-lg p-2 ${device === 'desktop' ? 'bg-violet-50 text-violet-700' : 'text-zinc-400'}`}><Monitor className="size-4" /></button>
            <button onClick={() => setDevice('mobile')} className={`rounded-lg p-2 ${device === 'mobile' ? 'bg-violet-50 text-violet-700' : 'text-zinc-400'}`}><Smartphone className="size-4" /></button>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-6">
            <div className={`min-h-full overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-xl transition-all ${device === 'mobile' ? 'w-[390px]' : 'w-full max-w-[1040px]'}`}>
              <div className="bg-zinc-900 px-4 py-2 text-center text-xs text-white">Aperçu — utilise /boutiques pour éditer et sauvegarder</div>
              {product ? (
                <>
                  <div className="grid gap-6 p-6 md:grid-cols-2">
                    <div className="aspect-square overflow-hidden rounded-xl bg-zinc-100">
                      {product.images?.[0] && <img src={product.images[0]} alt="" className="size-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{product.title}</p>
                      <div className="mt-5 rounded-xl border-2 border-violet-400 p-4 text-sm">
                        <b>Formulaire de commande</b>
                        <div className="mt-3 h-10 rounded-lg bg-zinc-100" />
                        <div className="mt-2 h-10 rounded-lg bg-zinc-100" />
                        <div className="mt-3 h-10 rounded-lg bg-violet-600" />
                      </div>
                    </div>
                  </div>
                  {sections.filter(s => s.visible).map(section => (
                    <section key={section.id} className="border-t border-zinc-100 px-6 py-8">
                      <h3 className="text-center text-lg font-bold">{section.settings?.title || section.type}</h3>
                      <div className="mx-auto mt-4 h-20 max-w-xl rounded-xl bg-gradient-to-r from-violet-50 via-zinc-50 to-emerald-50" />
                    </section>
                  ))}
                </>
              ) : (
                <div className="p-20 text-center text-sm text-zinc-500">Choisis un produit pour commencer.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
