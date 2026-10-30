'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePerm, logActivity } from '@/lib/context'

/**
 * Supprime un produit (et ses variantes + prix par cascade).
 * Utilisé depuis la page d'édition produit.
 */
export async function deleteProduct(productId: string): Promise<void> {
  const { supabase, store } = await requirePerm('products.write')

  const { data: product } = await supabase
    .from('products')
    .select('id, title')
    .eq('id', productId)
    .eq('store_id', store.id)
    .maybeSingle()

  if (!product) {
    redirect('/dashboard/products')
  }

  await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('store_id', store.id)

  await logActivity(store.id, 'product.deleted', { title: product.title })
  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}
