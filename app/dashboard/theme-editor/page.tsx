import { requirePerm } from '@/lib/context'
import { StoreThemeEditor } from './StoreThemeEditor'

export default async function ThemeEditorPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: productId } = await searchParams
  const { supabase, store } = await requirePerm('pages.write')
  const [{ data: products }, { data: current }] = await Promise.all([
    supabase.from('products').select('id, title, images, description').eq('store_id', store.id).neq('status', 'archived').order('updated_at', { ascending: false }),
    productId ? supabase.from('product_pages').select('product_id, sections').eq('store_id', store.id).eq('product_id', productId).is('market_id', null).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const selected = products?.find((p) => p.id === productId) ?? products?.[0]
  return <StoreThemeEditor products={(products ?? []) as any[]} selected={selected as any} initialSections={(current?.sections ?? []) as any[]} />
}
