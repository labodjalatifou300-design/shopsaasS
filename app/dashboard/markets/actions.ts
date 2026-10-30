'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logActivity, requirePerm } from '@/lib/context'
import type { FormState } from '@/lib/form'

const MarketSchema = z.object({
  name: z.string().trim().min(2, 'Nom du marché trop court').max(60),
  country_code: z.string().trim().length(2, 'Pays invalide').toUpperCase(),
  currency: z.string().trim().length(3, 'Devise invalide (3 lettres, ex : XOF)').toUpperCase(),
  phone_prefix: z.string().trim().regex(/^\+\d{1,4}$/, 'Indicatif invalide (ex : +228)'),
  shipping_fee: z.coerce.number().min(0, 'Frais de livraison invalides'),
  cities: z.array(z.string().trim().min(1)).max(300),
})

export async function saveMarket(marketId: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, store } = await requirePerm('markets.write')

  const parsed = MarketSchema.safeParse({
    name: fd.get('name'),
    country_code: fd.get('country_code'),
    currency: fd.get('currency'),
    phone_prefix: fd.get('phone_prefix'),
    shipping_fee: fd.get('shipping_fee') || 0,
    cities: String(fd.get('cities') ?? '')
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  const values = parsed.data

  let targetId = marketId
  if (marketId) {
    const { data: current } = await supabase
      .from('markets')
      .select('id, country_code, currency, phone_prefix')
      .eq('id', marketId)
      .eq('store_id', store.id)
      .maybeSingle()
    if (!current) return { error: 'Le marché de cette boutique est introuvable.' }
    if (
      current.country_code.trim() !== values.country_code ||
      current.currency.trim() !== values.currency ||
      current.phone_prefix !== values.phone_prefix
    ) {
      return { error: 'Le pays et la devise sont liés à la boutique et ne peuvent pas être remplacés.' }
    }
  } else {
    const { data: existingActive } = await supabase
      .from('markets')
      .select('id')
      .eq('store_id', store.id)
      .eq('active', true)
      .maybeSingle()
    if (existingActive) return { error: 'Cette boutique a déjà son marché. Modifie celui-ci au lieu d’en ajouter un autre.' }

    // Réactiver un ancien marché de cette boutique si la migration a laissé
    // des données historiques inactives pour préserver les commandes.
    const { data: oldMarket } = await supabase
      .from('markets')
      .select('id')
      .eq('store_id', store.id)
      .eq('country_code', values.country_code)
      .limit(1)
      .maybeSingle()
    targetId = oldMarket?.id ?? null
  }

  const { error } = targetId
    ? await supabase.from('markets').update({ ...values, is_default: true, active: true }).eq('id', targetId).eq('store_id', store.id)
    : await supabase.from('markets').insert({ ...values, store_id: store.id, is_default: true, active: true })

  if (error) {
    if (error.code === '23505') return { error: 'Cette boutique a déjà un marché actif.' }
    return { error: 'Enregistrement impossible.' }
  }

  await logActivity(store.id, targetId ? 'market.updated' : 'market.created', { name: values.name })
  revalidatePath('/dashboard/markets')
  return { message: targetId ? 'Marché de la boutique mis à jour.' : 'Marché attribué à la boutique.' }
}

