'use server'

import { revalidatePath } from 'next/cache'
import { requirePerm } from '@/lib/context'

export async function markCartContacted(cartId: string) {
  const { supabase, store } = await requirePerm('orders.write')
  const { error } = await supabase
    .from('abandoned_carts')
    .update({ status: 'contacted' })
    .eq('id', cartId)
    .eq('store_id', store.id)
    .eq('status', 'active')
  if (error) return
  revalidatePath('/dashboard/orders/abandoned-carts')
}
