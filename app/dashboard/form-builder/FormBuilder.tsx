'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, GripVertical, Plus, Save, Settings2, ShoppingBag, Trash2, X } from 'lucide-react'
import { saveFormConfig } from './actions'
import { Card, Checkbox, Field, Input, Select, buttonClass } from '@/components/ui'

type FieldItem = { id: string; type: string; label: string; required: boolean; visible: boolean; placeholder?: string }
type Offer = { id: string; quantity: number; title: string; discountType: 'percentage' | 'fixed' | 'bogo'; discount: string; badge: string; popular: boolean }
type Upsell = { id: string; name: string; trigger: 'before' | 'after'; product: string; offers: string }
type FormStyles = { accent?: string; buttonText?: string; buttonTextColor?: string; buttonRadius?: number; buttonShadow?: boolean; buttonAnimation?: string; formBackground?: string; formTextColor?: string; labelAlign?: 'left' | 'center' | 'right'; fieldRadius?: number; fieldBackground?: string }
const defaultFields: FieldItem[] = [
  { id: 'intro', type: 'text', label: 'Veuillez remplir le formulaire pour passer commande', required: false, visible: true },
  { id: 'cart', type: 'cart', label: 'Contenu du panier', required: false, visible: true },
  { id: 'name', type: 'text', label: 'Nom', required: true, visible: true, placeholder: 'Nom' },
  { id: 'phone', type: 'tel', label: 'Téléphone', required: true, visible: true, placeholder: 'Téléphone' },
  { id: 'address', type: 'text', label: 'Adresse', required: true, visible: true, placeholder: 'Adresse' },
  { id: 'city', type: 'text', label: 'Ville', required: false, visible: true, placeholder: 'Ville' },
]

export function FormBuilder({ initial }: { initial?: { mode?: 'inline' | 'popup'; fields?: FieldItem[]; bundle?: { enabled?: boolean; offers?: { label: string; price: string }[] }; styles?: FormStyles; upsells?: Upsell[]; quantity_offers?: Offer[] } | null }) {
  const [mode, setMode] = useState<'inline' | 'popup'>(initial?.mode ?? 'inline')
  const [fields, setFields] = useState<FieldItem[]>(initial?.fields ?? defaultFields)
  const [bundle, setBundle] = useState(initial?.bundle ?? { enabled: true, offers: [{ label: '1 produit', price: '15 000' }, { label: '2 produits', price: '25 000' }] })
  const [accent, setAccent] = useState(initial?.styles?.accent ?? '#2563eb')
  const [buttonText, setButtonText] = useState(initial?.styles?.buttonText ?? 'JE VALIDE MA COMMANDE')
  const [styles, setStyles] = useState<FormStyles>({ buttonTextColor: '#ffffff', buttonRadius: 12, buttonShadow: true, buttonAnimation: 'none', formBackground: '#ffffff', formTextColor: '#18181b', labelAlign: 'left', fieldRadius: 10, fieldBackground: '#ffffff', ...(initial?.styles ?? {}) })
  const [quantityOffers, setQuantityOffers] = useState<Offer[]>(initial?.quantity_offers ?? [
    { id: 'offer-1', quantity: 1, title: '1 unité', discountType: 'percentage', discount: '0', badge: '', popular: false },
    { id: 'offer-2', quantity: 2, title: '2 unités', discountType: 'percentage', discount: '20', badge: 'Le plus populaire', popular: true },
    { id: 'offer-3', quantity: 3, title: '3 unités', discountType: 'percentage', discount: '30', badge: 'Le meilleur prix', popular: false },
  ])
  const [upsells, setUpsells] = useState<Upsell[]>(initial?.upsells ?? [])
  const [tab, setTab] = useState<'builder' | 'quantity' | 'upsells'>('builder')
  const [styleOpen, setStyleOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>('name')
  const [pending, startTransition] = useTransition()
  const [notice, setNotice] = useState('')

  function save() {
    startTransition(async () => {
      const res = await saveFormConfig({ mode, fields, bundle, styles: { ...styles, accent, buttonText }, upsells, quantityOffers })
      setNotice(res.error ?? 'Formulaire enregistré.')
      setTimeout(() => setNotice(''), 2600)
    })
  }

  function addField() {
    const id = `field-${Date.now()}`
    setFields([...fields, { id, type: 'text', label: 'Nouveau champ', required: false, visible: true }])
    setSelected(id)
  }

  const active = fields.find((f) => f.id === selected)
  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-600">Éditeur de thème</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Formulaire de commande</h1><p className="mt-1 text-sm text-zinc-500">Configure le formulaire, les offres bundle et le rendu directement dans la page produit.</p></div>
        <button onClick={save} disabled={pending} className={buttonClass('primary')}><Save className="size-4" />{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
      {notice && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      <div className="mb-5 flex gap-1 rounded-xl bg-zinc-100 p-1">
        {([['builder', 'Créateur de formulaire'], ['quantity', 'Offres quantité'], ['upsells', 'Upsells & Downsells']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === key ? 'bg-white text-violet-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}>{label}</button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {tab === 'quantity' && <Card>
            <h2 className="font-semibold">Offre de quantité</h2>
            <p className="mt-1 text-sm text-zinc-500">Un seul produit, trois offres affichées simultanément dans le formulaire.</p>
            <div className="mt-4 space-y-3">{quantityOffers.map((offer, i) => <div key={offer.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between"><b>Offre {i + 1}</b><button onClick={() => setQuantityOffers(items => items.filter(o => o.id !== offer.id))} className="text-zinc-400 hover:text-red-600"><Trash2 className="size-4" /></button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Quantité"><Input type="number" min={1} value={offer.quantity} onChange={e => setQuantityOffers(items => items.map(o => o.id === offer.id ? { ...o, quantity: Number(e.target.value) } : o))} /></Field>
                <Field label="Titre"><Input value={offer.title} onChange={e => setQuantityOffers(items => items.map(o => o.id === offer.id ? { ...o, title: e.target.value } : o))} /></Field>
                <Field label="Type de réduction"><Select value={offer.discountType} onChange={e => setQuantityOffers(items => items.map(o => o.id === offer.id ? { ...o, discountType: e.target.value as Offer['discountType'] } : o))}><option value="percentage">Pourcentage</option><option value="fixed">Montant fixe</option><option value="bogo">Un acheté, un offert</option></Select></Field>
                <Field label="Valeur"><Input value={offer.discount} onChange={e => setQuantityOffers(items => items.map(o => o.id === offer.id ? { ...o, discount: e.target.value } : o))} /></Field>
                <Field label="Badge"><Input value={offer.badge} placeholder="Le plus populaire" onChange={e => setQuantityOffers(items => items.map(o => o.id === offer.id ? { ...o, badge: e.target.value } : o))} /></Field>
                <Checkbox label="Sélectionnée par défaut" checked={offer.popular} onChange={e => setQuantityOffers(items => items.map(o => o.id === offer.id ? { ...o, popular: e.target.checked } : o))} />
              </div>
            </div>)}</div>
            <button onClick={() => setQuantityOffers(items => [...items, { id: `offer-${Date.now()}`, quantity: items.length + 1, title: `${items.length + 1} unités`, discountType: 'percentage', discount: '0', badge: '', popular: false }])} className="mt-4 text-sm font-medium text-violet-700"><Plus className="mr-1 inline size-4" />Ajouter une offre</button>
          </Card>}
          {tab === 'upsells' && <Card>
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Upsells & downsells</h2><p className="mt-1 text-sm text-zinc-500">Configure les offres complémentaires avant ou après l’achat.</p></div><button onClick={() => setUpsells(items => [...items, { id: `upsell-${Date.now()}`, name: 'Nouvelle offre', trigger: 'after', product: '', offers: '' }])} className={buttonClass('secondary', 'px-3 py-1.5')}><Plus className="size-4" />Nouvel upsell</button></div>
            <div className="space-y-3">{upsells.length === 0 ? <p className="rounded-xl bg-zinc-50 p-6 text-center text-sm text-zinc-500">Aucun upsell configuré.</p> : upsells.map((upsell) => <div key={upsell.id} className="rounded-2xl border border-zinc-200 p-4"><div className="mb-3 flex items-center justify-between"><b>{upsell.name}</b><button onClick={() => setUpsells(items => items.filter(u => u.id !== upsell.id))}><Trash2 className="size-4 text-zinc-400" /></button></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Nom"><Input value={upsell.name} onChange={e => setUpsells(items => items.map(u => u.id === upsell.id ? { ...u, name: e.target.value } : u))} /></Field><Field label="Déclenchement"><Select value={upsell.trigger} onChange={e => setUpsells(items => items.map(u => u.id === upsell.id ? { ...u, trigger: e.target.value as Upsell['trigger'] } : u))}><option value="before">Avant l’achat</option><option value="after">Après l’achat</option></Select></Field><Field label="Produit concerné"><Input value={upsell.product} placeholder="Nom du produit" onChange={e => setUpsells(items => items.map(u => u.id === upsell.id ? { ...u, product: e.target.value } : u))} /></Field><Field label="Offres"><Input value={upsell.offers} placeholder="10%, 2 000 CFA, BOGO..." onChange={e => setUpsells(items => items.map(u => u.id === upsell.id ? { ...u, offers: e.target.value } : u))} /></Field></div></div>)}</div>
          </Card>}
          {tab === 'builder' && <>
          <Card>
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Type de formulaire</h2><p className="mt-1 text-xs text-zinc-500">Inline affiche les champs. Pop-up affiche un bouton d’achat.</p></div><Settings2 className="size-4 text-zinc-400" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['popup', 'inline'] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-xl border p-4 text-left transition ${mode === item ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100' : 'border-zinc-200 hover:bg-zinc-50'}`}><div className="mb-3 flex items-center gap-2 font-medium"><span className="flex size-8 items-center justify-center rounded-lg bg-white ring-1 ring-zinc-200">{item === 'popup' ? '↗' : '☷'}</span>{item === 'popup' ? 'Formulaire sous forme de pop-up' : 'Formulaire intégré'}</div><span className="text-xs text-zinc-500">{item === 'popup' ? 'Le bouton ouvre les champs dans une fenêtre.' : 'Les champs restent visibles dans la page.'}</span></button>)}
            </div>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold">Champs du formulaire</h2><p className="mt-1 text-xs text-zinc-500">Réordonne, masque ou rends un champ obligatoire.</p></div><button onClick={addField} className={buttonClass('secondary', 'px-3 py-1.5')}><Plus className="size-4" /> Ajouter</button></div>
            <div className="space-y-2">{fields.map((field, index) => <div key={field.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${selected === field.id ? 'border-violet-400 bg-violet-50/50' : 'border-zinc-200'}`}><GripVertical className="size-4 shrink-0 text-zinc-400" /><button className="min-w-0 flex-1 text-left" onClick={() => setSelected(field.id)}><span className="block truncate text-sm font-medium">{field.label}</span><span className="text-xs text-zinc-400">{field.required ? 'Obligatoire' : 'Optionnel'}</span></button><button title="Masquer" onClick={() => setFields(fields.map((f) => f.id === field.id ? { ...f, visible: !f.visible } : f))} className={`text-xs ${field.visible ? 'text-zinc-400' : 'text-violet-600'}`}>{field.visible ? '◉' : '○'}</button>{index > 0 && <button onClick={() => setFields(fields.map((f, i) => i === index - 1 ? fields[index] : i === index ? fields[index - 1] : f))} className="text-xs text-zinc-400">↑</button>}<button onClick={() => setFields(fields.filter((f) => f.id !== field.id))} className="text-zinc-400 hover:text-red-600"><Trash2 className="size-4" /></button></div>)}</div>
          </Card>
          <Card>
            <div className="mb-4 flex items-center gap-2"><ShoppingBag className="size-4 text-violet-600" /><div><h2 className="font-semibold">Offres & bundles</h2><p className="mt-1 text-xs text-zinc-500">Reproduis les offres quantité d’EasySell sans quitter l’éditeur.</p></div></div>
            <Checkbox label="Afficher les offres bundle dans le formulaire" checked={bundle.enabled !== false} onChange={(e) => setBundle({ ...bundle, enabled: e.target.checked })} />
            <div className="mt-3 space-y-2">{(bundle.offers ?? []).map((offer, i) => <div key={i} className="grid grid-cols-[1fr_110px_auto] gap-2"><Input value={offer.label} onChange={(e) => setBundle({ ...bundle, offers: bundle.offers?.map((o, j) => j === i ? { ...o, label: e.target.value } : o) })} /><Input value={offer.price} onChange={(e) => setBundle({ ...bundle, offers: bundle.offers?.map((o, j) => j === i ? { ...o, price: e.target.value } : o) })} /><button onClick={() => setBundle({ ...bundle, offers: bundle.offers?.filter((_, j) => j !== i) })} className="rounded-lg px-2 text-zinc-400 hover:text-red-600"><X className="size-4" /></button></div>)}</div>
            <button onClick={() => setBundle({ ...bundle, offers: [...(bundle.offers ?? []), { label: `${(bundle.offers?.length ?? 0) + 1} produits`, price: '' }] })} className="mt-3 text-sm font-medium text-violet-700">+ Ajouter une offre</button>
          </Card>
          {active && <Card><h2 className="font-semibold">Champ sélectionné</h2><div className="mt-4 space-y-4"><Field label="Libellé"><Input value={active.label} onChange={(e) => setFields(fields.map((f) => f.id === active.id ? { ...f, label: e.target.value } : f))} /></Field>{active.id !== 'intro' && active.id !== 'cart' && <Field label="Texte indicatif"><Input value={active.placeholder ?? ''} onChange={(e) => setFields(fields.map((f) => f.id === active.id ? { ...f, placeholder: e.target.value } : f))} /></Field>}<Checkbox label="Champ obligatoire" checked={active.required} onChange={(e) => setFields(fields.map((f) => f.id === active.id ? { ...f, required: e.target.checked } : f))} /></div></Card>}
          <Card><button onClick={() => setStyleOpen(!styleOpen)} className="flex w-full items-center justify-between text-left font-semibold"><span>Style du formulaire et du bouton</span><ChevronDown className={`size-4 transition ${styleOpen ? 'rotate-180' : ''}`} /></button>{styleOpen && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Fond du formulaire"><Input type="color" value={styles.formBackground} onChange={e => setStyles(s => ({ ...s, formBackground: e.target.value }))} className="h-10 p-1" /></Field><Field label="Couleur du texte"><Input type="color" value={styles.formTextColor} onChange={e => setStyles(s => ({ ...s, formTextColor: e.target.value }))} className="h-10 p-1" /></Field><Field label="Alignement des étiquettes"><Select value={styles.labelAlign} onChange={e => setStyles(s => ({ ...s, labelAlign: e.target.value as FormStyles['labelAlign'] }))}><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option></Select></Field><Field label="Arrondi du bouton"><input type="range" min="0" max="28" value={styles.buttonRadius} onChange={e => setStyles(s => ({ ...s, buttonRadius: Number(e.target.value) }))} className="w-full" /></Field><Field label="Couleur du bouton"><Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 p-1" /></Field><Field label="Couleur du texte du bouton"><Input type="color" value={styles.buttonTextColor} onChange={e => setStyles(s => ({ ...s, buttonTextColor: e.target.value }))} className="h-10 p-1" /></Field><Field label="Texte du bouton"><Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} /></Field><Field label="Animation"><Select value={styles.buttonAnimation} onChange={e => setStyles(s => ({ ...s, buttonAnimation: e.target.value }))}><option value="none">Aucune</option><option value="left-right">Left-right shaking</option><option value="up-down">Up-down shaking</option><option value="bottom">Bottom shaking</option><option value="pulse">Pulse</option><option value="bounce">Bounce</option></Select></Field><Checkbox label="Ombre du bouton" checked={Boolean(styles.buttonShadow)} onChange={e => setStyles(s => ({ ...s, buttonShadow: e.target.checked }))} /></div>}</Card>
          </>}
        </div>
        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card className="bg-zinc-50">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Aperçu direct</h2><span className="rounded-full bg-white px-2 py-1 text-xs text-zinc-500 ring-1 ring-zinc-200">{mode === 'popup' ? 'Pop-up' : 'Intégré'}</span></div>
            <div className="mx-auto max-w-[310px] rounded-2xl border border-zinc-200 p-4 shadow-lg" style={{ backgroundColor: styles.formBackground, color: styles.formTextColor }}>
              {mode === 'popup' ? <><div className="py-8 text-center"><p className="text-sm font-semibold">Prêt à commander ?</p><button className="mt-4 w-full px-3 py-3 text-sm font-semibold" style={{ background: accent, color: styles.buttonTextColor, borderRadius: styles.buttonRadius, boxShadow: styles.buttonShadow ? '0 8px 18px rgba(37,99,235,.25)' : 'none' }} onClick={() => setMode('inline')}>{buttonText}</button></div></> : <><p className="mb-4 text-center text-sm font-semibold text-red-600">Veuillez remplir le formulaire pour passer commande</p>{bundle.enabled && <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 p-3"><p className="mb-2 text-xs font-semibold text-violet-700">Choisissez votre offre</p>{(bundle.offers ?? []).map((offer, i) => <div key={i} className="mb-1 flex items-center justify-between rounded-lg bg-white px-2 py-2 text-xs"><span>{offer.label}</span><b>{offer.price} CFA</b></div>)}</div>}{fields.filter((f) => f.visible && f.id !== 'intro').map((field) => field.id === 'cart' ? <div key={field.id} className="mb-3 flex items-center gap-2 rounded-xl bg-zinc-50 p-2 text-xs"><span className="flex size-8 items-center justify-center rounded-lg bg-white">🛍️</span><span className="flex-1 font-medium">Nom du produit</span><b>CFA 19.99</b></div> : <label key={field.id} className="mb-2 block text-xs font-medium" style={{ textAlign: styles.labelAlign }}>{field.label}{field.required && <span className="text-red-500"> *</span>}<Input className="mt-1" placeholder={field.placeholder || field.label} /></label>)}<button className="mt-2 w-full px-3 py-3 text-xs font-bold" style={{ background: accent, color: styles.buttonTextColor, borderRadius: styles.buttonRadius, boxShadow: styles.buttonShadow ? '0 8px 18px rgba(37,99,235,.25)' : 'none' }}>{buttonText}<span className="block text-[10px] font-normal">CFA 20.00</span></button></>}
            </div>
          </Card>
          <Card className="mt-4 space-y-4"><Field label="Couleur du bouton"><Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 p-1" /></Field><Field label="Texte du bouton"><Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} /></Field></Card>
        </div>
      </div>
    </div>
  )
}
