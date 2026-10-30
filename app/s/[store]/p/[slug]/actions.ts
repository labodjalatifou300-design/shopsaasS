'use server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchOrderPush } from '@/lib/push/dispatch-order-push'
import { sendMetaPurchase } from '@/lib/meta/conversions-api'
import { markAbandonedCartConverted } from '@/lib/abandoned-cart/server'

export async function createPublicOrder(input: {
  storeId: string
  marketId: string
  name: string
  phone: string
  city: string
  address: string
  note: string
  lines: unknown[]
  subtotal: number
  shipping: number
  total: number
  currency?: string
  productId?: string
  productName?: string
  quantity?: number
  marketingConsent?: boolean
  email?: string | null
  fbp?: string | null
  fbc?: string | null
  abandonedSessionId?: string | null
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_public_order', { p_store_id: input.storeId, p_market_id: input.marketId, p_name: input.name, p_phone: input.phone, p_city: input.city, p_address: input.address, p_note: input.note, p_lines: input.lines, p_subtotal: input.subtotal, p_shipping: input.shipping, p_total: input.total })
  if (error) return { error: error.message.includes('duplicate') ? 'Une commande avec ce numéro existe déjà depuis moins de 24 h.' : 'Vérifie les champs obligatoires.' }
  const orderId = String(data)
  const admin = createAdminClient()
  const [{ data: order }, requestHeaders] = await Promise.all([
    admin.from('orders').select('id, order_number').eq('id', orderId).eq('store_id', input.storeId).maybeSingle(),
    headers(),
  ])
  const orderNumber = order?.order_number || orderId
  await Promise.all([
    dispatchOrderPush(input.storeId, orderId),
    sendMetaPurchase(admin, {
      storeId: input.storeId,
      orderId,
      orderNumber,
      value: input.total,
      currency: input.currency || 'XOF',
      productId: input.productId,
      productName: input.productName,
      quantity: input.quantity,
      consent: input.marketingConsent === true,
      eventSourceUrl: requestHeaders.get('referer'),
      ipAddress: requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: requestHeaders.get('user-agent'),
      phone: input.phone,
      email: input.email,
      fbp: input.fbp,
      fbc: input.fbc,
    }).catch((err) => {
      console.error('[storefront/meta] Purchase failed:', err instanceof Error ? err.message : 'unknown error')
      return { sent: false as const, reason: 'network_error' as const }
    }),
    markAbandonedCartConverted(admin, {
      storeId: input.storeId,
      productId: input.productId,
      sessionId: input.abandonedSessionId,
      orderId,
    }),
  ])
  return { number: orderNumber, orderId, eventId: `purchase_${orderId}` }
}
