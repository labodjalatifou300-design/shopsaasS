import { formatMoney } from '@/lib/utils'

type Section = { id: string; type: string; visible: boolean; settings?: Record<string, string> }

export function ProductSections({ sections, product, accent }: { sections: Section[]; product: { description: string; images: string[] }; accent: string }) {
  const themeId = sections[0]?.settings?._theme
  const themeAccent = themeId === 'zenvyra' ? '#287c5a' : themeId === 'shrine' ? '#e8527a' : accent
  const themeSurface = themeId === 'zenvyra' ? '#f4f7f2' : themeId === 'shrine' ? '#fff8f3' : '#ffffff'
  return (
    <div className="mt-10 space-y-8" style={{ background: themeSurface }}>
      {sections.filter((s) => s.visible && s.type !== 'Bloc produit' && s.type !== 'Formulaire de commande').map((section, index) => {
        const title = section.settings?.title || section.type
        const text = section.settings?.text || (section.type === 'FAQ' ? 'Une question ? La livraison se fait rapidement et le paiement se fait à la réception.' : section.type === 'Garantie' ? 'Satisfait ou accompagné par notre équipe. Commande simple, livraison locale.' : 'Une expérience pensée pour une commande simple, claire et rassurante.')
        return (
          <section key={section.id} className={`product-section product-section-${section.settings?.animation || 'fade'} overflow-hidden rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm`} style={{ animationDelay: `${index * 80}ms`, fontFamily: section.settings?.font || 'Inter' }}>
            <h2 className="text-center text-xl font-bold tracking-tight" style={{ color: themeAccent }}>{title}</h2>
            {section.type === 'Image + texte' && product.images[index % product.images.length] ? (
              <div className="mt-5 grid items-center gap-5 md:grid-cols-2">
                <img src={product.images[index % product.images.length]} alt="" className="max-h-[420px] w-full rounded-2xl object-cover" />
                <p className="text-sm leading-7 text-zinc-600">{text}</p>
              </div>
            ) : section.type === 'Vidéo' && product.images[0] ? (
              <img src={product.images[0]} alt="" className="mx-auto mt-5 max-h-[420px] rounded-2xl object-cover" />
            ) : section.type === 'Avis clients' ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">{['Service rapide', 'Très bon produit', 'Je recommande'].map((review) => <div key={review} className="rounded-2xl bg-zinc-50 p-4 text-center text-sm"><div className="text-amber-400">★★★★★</div><p className="mt-2 font-medium">{review}</p><p className="mt-1 text-xs text-zinc-500">Client vérifié</p></div>)}</div>
            ) : (
              <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-zinc-600">{text}</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
