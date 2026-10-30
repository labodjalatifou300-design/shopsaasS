'use client'

export default function PrixRender({ settings, product, themeSettings }: { settings: any; product?: any; themeSettings?: any }) {
  const s = settings || {}

  // Devise : marché > produit > fallback XOF
  const currency = themeSettings?.currency || product?.currency || 'XOF'

  // Prix principal — s.price (string saisie manuellement) OU calculé depuis product.price
  // On ignore s.price si c'est une chaîne vide
  const hasManualPrice = typeof s.price === 'string' && s.price.trim() !== ''
  const priceDisplay = hasManualPrice
    ? s.price
    : product?.price != null && product.price !== '' && Number(product.price) > 0
      ? `${Number(product.price).toLocaleString('fr-FR')} ${currency}`
      : null

  // Prix barré
  const rawCompare = s.compare_at_price || product?.compare_price || product?.compare_at_price
  const hasCompare = rawCompare != null && rawCompare !== '' && Number(rawCompare) > 0
  const compareDisplay = hasCompare
    ? `${Number(rawCompare).toLocaleString('fr-FR')} ${currency}`
    : null

  // % de réduction
  const discountPct =
    hasCompare && product?.price && Number(rawCompare) > Number(product.price)
      ? Math.round((1 - Number(product.price) / Number(rawCompare)) * 100)
      : null

  const priceSize = s.price_font_size ? `${s.price_font_size}px` : '28px'
  const compareSize = s.compare_font_size ? `${s.compare_font_size}px` : '15px'

  // Rien à afficher
  if (!priceDisplay && !compareDisplay) return null

  return (
    <div className="px-5 py-3 flex items-center gap-2.5 flex-wrap">
      {priceDisplay && (
        <span
          className="font-black"
          style={{
            fontFamily: s.price_font || 'inherit',
            color: s.price_color || 'var(--color-price, var(--color-primary, #111827))',
            fontSize: priceSize,
            fontWeight: s.price_weight || 900,
          }}
        >
          {priceDisplay}
        </span>
      )}
      {compareDisplay && (
        <span className="line-through" style={{ color: s.compare_color || '#9ca3af', fontSize: compareSize }}>
          {compareDisplay}
        </span>
      )}
      {s.show_badge !== false && compareDisplay && priceDisplay && (
        <span
          className="text-[11px] font-black px-2.5 py-1 rounded-full"
          style={{ backgroundColor: s.badge_bg || '#dc2626', color: s.badge_text_color || '#ffffff' }}
        >
          {discountPct ? `-${discountPct}%` : (s.badge_text || 'Promo')}
        </span>
      )}
    </div>
  )
}
