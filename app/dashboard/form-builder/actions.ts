'use server'

import { revalidatePath } from 'next/cache'
import { requirePerm } from '@/lib/context'

export async function saveFormConfig(config: {
  mode: 'inline' | 'popup'
  fields: unknown[]
  bundle: unknown
  styles: unknown
  upsells?: unknown
  quantityOffers?: unknown
}) {
  const { supabase, store } = await requirePerm('pages.write')
  const { error } = await supabase.from('form_configs').upsert(
    { store_id: store.id, name: 'Formulaire principal', mode: config.mode, fields: config.fields, bundle: config.bundle, styles: config.styles, upsells: config.upsells ?? [], quantity_offers: config.quantityOffers ?? [], updated_at: new Date().toISOString() },
    { onConflict: 'store_id,name' },
  )
  if (error) return { error: 'Impossible d’enregistrer le formulaire.' }
  revalidatePath('/dashboard/form-builder')
  return { ok: true }
}
