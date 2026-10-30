import { cache } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type PublicStore = { id: string; name: string; slug: string; logo_url: string | null; primary_color: string; whatsapp: string | null }
export type PublicMarket = { id: string; name: string; country_code: string; currency: string; shipping_fee: number; is_default: boolean }

/** Une boutique publique utilise toujours son unique marché actif par défaut. */
export const getStorefront = cache(async (slug: string, _marketCode?: string) => {
  const supabase = await createClient()
  const { data: store } = await supabase.from('stores').select('id, name, slug, logo_url, primary_color, whatsapp').eq('slug', slug).maybeSingle()
  if (!store) return null
  const { data: markets } = await supabase
    .from('markets')
    .select('id, name, country_code, currency, shipping_fee, is_default')
    .eq('store_id', store.id)
    .eq('active', true)
    .eq('is_default', true)
    .limit(1)
  const list = (markets ?? []) as PublicMarket[]
  const market = list[0] ?? null
  // Sur le sous-domaine, les liens sont "/p/..." ; en aperçu (/s/slug/...), on garde le préfixe
  const onSubdomain = (await headers()).get('x-storefront-host') === '1'
  const base = onSubdomain ? '' : `/s/${slug}`
  return { supabase, store: store as PublicStore, markets: list, market, base }
})
