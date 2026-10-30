import { requirePerm } from '@/lib/context'
import { FormBuilder } from './FormBuilder'

export default async function FormBuilderPage() {
  const { supabase, store } = await requirePerm('pages.write')
  const { data } = await supabase.from('form_configs').select('mode, fields, bundle, styles, upsells, quantity_offers').eq('store_id', store.id).eq('name', 'Formulaire principal').maybeSingle()
  return <FormBuilder initial={data as any} />
}
