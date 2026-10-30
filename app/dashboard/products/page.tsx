import { Plus } from 'lucide-react'
import { requirePerm } from '@/lib/context'
import { can } from '@/lib/permissions'
import { EmptyState, PageHeader, buttonClass } from '@/components/ui'
import { createBlankProduct } from './product-actions'
import ProductsTable from './ProductsTable'

type Row = {
  id: string
  title: string
  status: 'draft' | 'active' | 'archived'
  images: string[]
  variants: { id: string; stock: number | null; variant_prices: { market_id: string; price: number }[] }[]
}

export default async function ProductsPage() {
  const { supabase, store, permissions } = await requirePerm('products.read')
  const canEdit = can(permissions, 'products.write')

  const [{ data }, { data: market }] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, status, images, variants(id, stock, variant_prices(market_id, price))')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false }),
    supabase.from('markets').select('id, currency').eq('store_id', store.id).eq('active', true).eq('is_default', true).maybeSingle(),
  ])
  const products = (data ?? []) as unknown as Row[]

  const newButton = canEdit ? (
    <form action={createBlankProduct}>
      <button type="submit" className={buttonClass('primary')}>
        <Plus className="size-4" /> Nouveau produit
      </button>
    </form>
  ) : null

  return (
    <>
      <PageHeader
        title="Produits"
        subtitle={`${products.length} produit${products.length > 1 ? 's' : ''}`}
        actions={newButton}
      />
      {products.length === 0 ? (
        <EmptyState
          title="Aucun produit pour le moment"
          text="Crée ton premier produit, ajoute ses photos et son prix dans la devise de cette boutique."
          action={newButton}
        />
      ) : (
        <ProductsTable
          products={products}
          market={market as any}
          canEdit={canEdit}
        />
      )}
    </>
  )
}
