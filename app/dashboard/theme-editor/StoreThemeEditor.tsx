'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Eye, GripVertical, Monitor, MoveDown, MoveUp, Palette, Plus, Save, Smartphone, Trash2 } from 'lucide-react'
import { saveProductPage, type PageSection } from '../products/actions'

type Product = { id: string; title: string; images: string[]; description: string }
type Theme = { id: string; name: string; accent: string; background: string; surface: string; text: string; radius: number }

const themes: Theme[] = [
  { id: 'refresh', name: 'Refresh clean', accent: '#2563eb', background: '#f6f8fb', surface: '#ffffff', text: '#111827', radius: 18 },
  { id: 'zenvyra', name: 'Zenvyra botanical', accent: '#287c5a', background: '#f4f7f2', surface: '#ffffff', text: '#20352b', radius: 24 },
  { id: 'shrine', name: 'Shrine conversion', accent: '#e8527a', background: '#fff8f3', surface: '#ffffff', text: '#3a2a2e', radius: 20 },
]
const catalog = ['Bandeau défilant', 'Bloc produit', 'Offres quantité', 'Formulaire de commande', 'Compte à rebours', 'Avant / Après', 'Image + texte', 'Vidéo', 'Avantages', 'Avis clients', 'Comparatif', 'Garanties', 'FAQ', 'Grille produits', 'Bouton Commander collant']
const starter = catalog.slice(0, 12)

export function StoreThemeEditor({ products, selected, initialSections }: { products: Product[]; selected?: Product; initialSections: PageSection[] }) {
  const [productId, setProductId] = useState(selected?.id ?? products[0]?.id ?? '')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [theme, setTheme] = useState(themes[0])
  const [sections, setSections] = useState<PageSection[]>(initialSections.length ? initialSections : starter.map((type, i) => ({ id: `${type}-${i}`, type, visible: true, settings: {} })))
  const [selectedId, setSelectedId] = useState(sections[0]?.id)
  const [pending, startTransition] = useTransition()
  const [notice, setNotice] = useState('')
  const product = products.find((p) => p.id === productId) ?? selected
  const active = sections.find((s) => s.id === selectedId)

  function save() {
    if (!productId) return
    startTransition(async () => {
      const result = await saveProductPage(productId, sections.map((section, index) => index === 0 ? { ...section, settings: { ...section.settings, _theme: theme.id } } : section))
      setNotice(result.error ?? `Thème « ${theme.name} » enregistré.`)
      setTimeout(() => setNotice(''), 2500)
    })
  }
  function updateActive(settings: Record<string, string>) {
    if (!active) return
    setSections(items => items.map(item => item.id === active.id ? { ...item, settings: { ...item.settings, ...settings } } : item))
  }
  function move(index: number, direction: -1 | 1) {
    setSections(items => items.map((item, i) => i === index ? items[index + direction] : i === index + direction ? items[index] : item))
  }
  const selectedImage = product?.images?.[0]
  return (
    <div className="fixed inset-0 flex min-h-screen flex-col bg-zinc-100 md:pl-64">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-3"><Link href="/dashboard" className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100">← Dashboard</Link><Eye className="size-5" style={{ color: theme.accent }} /><div><h1 className="font-semibold">Éditeur de boutique</h1><p className="hidden text-xs text-zinc-500 sm:block">Choisis un thème, organise tes sections et vois le rendu public.</p></div></div>
        <div className="flex items-center gap-2"><span className="hidden text-sm text-emerald-600 sm:block">{notice}</span><button onClick={save} disabled={pending || !productId} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: theme.accent }}><Save className="size-4" />{pending ? 'Enregistrement…' : 'Enregistrer'}</button></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-[320px] shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">Produit affiché</label>
          <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">{products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold"><Palette className="size-4" style={{ color: theme.accent }} /> Thèmes prêts à l’emploi</div>
          <div className="mt-3 grid gap-2">{themes.map(item => <button key={item.id} onClick={() => setTheme(item)} className={`rounded-xl border p-3 text-left ${theme.id === item.id ? 'ring-2' : ''}`} style={{ borderColor: item.accent, outlineColor: item.accent }}><span className="block font-semibold">{item.name}</span><span className="mt-2 block h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${item.accent}, ${item.background})` }} /></button>)}</div>
          <div className="mt-6 flex items-center justify-between"><div><h2 className="font-semibold">Sections de la boutique</h2><p className="text-xs text-zinc-500">Clique pour modifier, monte ou descends.</p></div><button onClick={() => { const id = `section-${Date.now()}`; setSections([...sections, { id, type: 'Image + texte', visible: true, settings: {} }]); setSelectedId(id) }} className="rounded-lg p-2 hover:bg-zinc-100" style={{ color: theme.accent }}><Plus className="size-4" /></button></div>
          <div className="mt-3 space-y-2">{sections.map((section, index) => <div key={section.id} className={`flex items-center gap-2 rounded-xl border px-2 py-2 ${selectedId === section.id ? 'bg-zinc-50 ring-1' : 'border-zinc-200'} ${!section.visible ? 'opacity-50' : ''}`} style={{ outlineColor: theme.accent }}><GripVertical className="size-4 text-zinc-400" /><button className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => setSelectedId(section.id)}>{section.type}</button><button disabled={!index} onClick={() => move(index, -1)} className="text-zinc-400 disabled:opacity-20"><MoveUp className="size-3.5" /></button><button disabled={index === sections.length - 1} onClick={() => move(index, 1)} className="text-zinc-400 disabled:opacity-20"><MoveDown className="size-3.5" /></button><button onClick={() => setSections(items => items.filter(item => item.id !== section.id))} className="text-zinc-400 hover:text-red-600"><Trash2 className="size-3.5" /></button></div>)}</div>
          <div className="mt-5 rounded-2xl border border-zinc-200 p-3"><p className="mb-2 text-xs font-bold uppercase text-zinc-500">Ajouter une section</p><div className="grid grid-cols-2 gap-1.5">{catalog.filter(type => !sections.some(s => s.type === type)).slice(0, 10).map(type => <button key={type} onClick={() => { const id = `section-${Date.now()}`; setSections([...sections, { id, type, visible: true, settings: {} }]); setSelectedId(id) }} className="rounded-lg bg-zinc-50 px-2 py-2 text-left text-[11px] hover:bg-zinc-100">{type}</button>)}</div></div>
          {active && <div className="mt-5 rounded-2xl border border-zinc-200 p-3"><p className="mb-3 text-xs font-bold uppercase text-zinc-500">Modifier la section</p><input value={active.settings?.title ?? ''} onChange={e => updateActive({ title: e.target.value })} placeholder="Titre de section" className="mb-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" /><textarea value={active.settings?.text ?? ''} onChange={e => updateActive({ text: e.target.value })} placeholder="Texte / contenu" rows={3} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" /></div>}
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 items-center justify-center gap-2 border-b border-zinc-200 bg-white"><button onClick={() => setDevice('desktop')} className={`rounded-lg p-2 ${device === 'desktop' ? 'bg-zinc-100' : 'text-zinc-400'}`}><Monitor className="size-4" /></button><button onClick={() => setDevice('mobile')} className={`rounded-lg p-2 ${device === 'mobile' ? 'bg-zinc-100' : 'text-zinc-400'}`}><Smartphone className="size-4" /></button></div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-6"><div className="overflow-hidden shadow-xl transition-all" style={{ width: device === 'mobile' ? 390 : 'min(100%, 1120px)', background: theme.background, color: theme.text, borderRadius: theme.radius }}><div className="px-4 py-2 text-center text-xs font-semibold text-white" style={{ background: theme.accent }}>Livraison rapide · Paiement à la livraison</div>{product ? <><div className="grid gap-8 p-6 md:grid-cols-2" style={{ background: theme.surface }}><div className="space-y-3">{selectedImage ? <img src={selectedImage} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: theme.radius }} /> : <div className="aspect-square rounded-2xl bg-zinc-100" />}<div className="grid grid-cols-4 gap-2">{product.images?.slice(0, 4).map(image => <img key={image} src={image} alt="" className="aspect-square rounded-lg object-cover" />)}</div></div><div className="flex flex-col justify-center"><h2 className="text-3xl font-black">{product.title}</h2><p className="mt-3 text-sm leading-7 opacity-70" dangerouslySetInnerHTML={{ __html: product.description || 'Description et bénéfices du produit.' }} /><div className="mt-5 rounded-2xl border p-4" style={{ borderColor: `${theme.accent}55` }}><p className="text-center font-bold" style={{ color: theme.accent }}>Veuillez remplir le formulaire pour passer commande</p><input className="mt-4 w-full rounded-lg border px-3 py-2" placeholder="Nom" /><input className="mt-2 w-full rounded-lg border px-3 py-2" placeholder="Téléphone" /><button className="mt-3 w-full rounded-xl px-3 py-3 font-bold text-white" style={{ background: theme.accent }}>🛒 COMMANDER MAINTENANT</button></div></div></div>{sections.filter(s => s.visible).map(section => <section key={section.id} onClick={() => setSelectedId(section.id)} className="border-t px-6 py-10" style={{ background: theme.surface, borderColor: `${theme.accent}22` }}><h3 className="text-center text-xl font-black" style={{ color: theme.accent }}>{section.settings?.title || section.type}</h3><p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-7 opacity-70">{section.settings?.text || 'Une section élégante, responsive et prête à personnaliser.'}</p></section>)}</> : <div className="p-20 text-center">Choisis un produit pour commencer.</div>}</div></div>
        </main>
      </div>
    </div>
  )
}
