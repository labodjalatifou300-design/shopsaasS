import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function markAbandonedCartConverted(
  admin: SupabaseClient,
  input: { storeId: string; productId?: string | null; sessionId?: string | null; orderId: string },
) {
  if (!input.sessionId || !input.productId) return
  const { error } = await admin
    .from('abandoned_carts')
    .update({
      status: 'converted',
      converted_order_id: input.orderId,
      last_seen_at: new Date().toISOString(),
    })
    .eq('store_id', input.storeId)
    .eq('product_id', input.productId)
    .eq('session_id', input.sessionId)
    .eq('status', 'active')
  if (error) console.warn('[abandoned-carts] conversion update failed:', error.message)
}
