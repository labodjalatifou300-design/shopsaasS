import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const saveSchema = z.object({
  action: z.literal('save'),
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  marketId: z.string().uuid(),
  sessionId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().max(254).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  quantity: z.number().int().min(1).max(99),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
})

const convertSchema = z.object({
  action: z.literal('convert'),
  storeId: z.string().uuid(),
  sessionId: z.string().uuid(),
  productId: z.string().uuid(),
  orderId: z.string().uuid(),
})

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  const requestHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(',')[0].trim().toLowerCase()
  if (!origin || !requestHost) return false
  try {
    const parsed = new URL(origin)
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000').split(':')[0].toLowerCase()
    const originHost = parsed.host.toLowerCase()
    const originDomain = parsed.hostname.toLowerCase()
    return originHost === requestHost
      || originDomain === rootDomain
      || originDomain.endsWith(`.${rootDomain}`)
      || (originDomain === 'localhost' && requestHost.startsWith('localhost'))
  } catch {
    return false
  }
}

function json(request: NextRequest, body: unknown, status = 200) {
  const origin = request.headers.get('origin') || ''
  return NextResponse.json(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    },
  })
}

export async function OPTIONS(request: NextRequest) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: 'Origine non autorisée.' }, { status: 403 })
  return json(request, { ok: true })
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) return json(request, { error: 'Origine non autorisée.' }, 403)
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return json(request, { error: 'Requête invalide.' }, 400)

  try {
    const admin = createAdminClient()

    if (body.action === 'convert') {
      const parsed = convertSchema.safeParse(body)
      if (!parsed.success) return json(request, { error: 'Données de conversion invalides.' }, 400)
      const input = parsed.data
      const { data: order } = await admin
        .from('orders')
        .select('id, store_id')
        .eq('id', input.orderId)
        .eq('store_id', input.storeId)
        .maybeSingle()
      if (!order) return json(request, { ok: true })
      const { error } = await admin
        .from('abandoned_carts')
        .update({ status: 'converted', converted_order_id: input.orderId, last_seen_at: new Date().toISOString() })
        .eq('store_id', input.storeId)
        .eq('session_id', input.sessionId)
        .eq('product_id', input.productId)
        .eq('status', 'active')
      if (error) throw error
      return json(request, { ok: true })
    }

    const parsed = saveSchema.safeParse(body)
    if (!parsed.success) return json(request, { error: 'Certaines informations du formulaire sont invalides.' }, 400)
    const input = parsed.data

    const { data: product } = await admin
      .from('products')
      .select('id, store_id, title, status')
      .eq('id', input.productId)
      .eq('store_id', input.storeId)
      .eq('status', 'active')
      .maybeSingle()
    const { data: market } = await admin
      .from('markets')
      .select('id, store_id, currency, shipping_fee, active')
      .eq('id', input.marketId)
      .eq('store_id', input.storeId)
      .eq('active', true)
      .maybeSingle()
    const { data: variant } = await admin
      .from('variants')
      .select('id, product_id, store_id')
      .eq('id', input.variantId)
      .eq('product_id', input.productId)
      .eq('store_id', input.storeId)
      .maybeSingle()
    if (!product || !market || !variant) return json(request, { error: 'Produit ou marché introuvable.' }, 400)

    const { data: price } = await admin
      .from('variant_prices')
      .select('price')
      .eq('variant_id', input.variantId)
      .eq('market_id', input.marketId)
      .eq('store_id', input.storeId)
      .maybeSingle()
    const estimatedTotal = Math.max(0, (Number(price?.price) || 0) * input.quantity + (Number(market.shipping_fee) || 0))
    const now = new Date().toISOString()

    const { error } = await admin
      .from('abandoned_carts')
      .upsert({
        store_id: input.storeId,
        product_id: input.productId,
        variant_id: input.variantId,
        market_id: input.marketId,
        session_id: input.sessionId,
        customer_name: input.name,
        customer_phone: input.phone,
        customer_email: input.email || null,
        customer_city: input.city || null,
        product_name: product.title,
        quantity: input.quantity,
        currency: market.currency,
        estimated_total: estimatedTotal,
        contact_consent_at: now,
        status: 'active',
        last_seen_at: now,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'store_id,session_id,product_id' })
    if (error) throw error

    return json(request, { ok: true })
  } catch (error) {
    console.error('[abandoned-carts] save failed:', error instanceof Error ? error.message : 'unknown error')
    return json(request, { error: 'Impossible d’enregistrer le panier maintenant.' }, 500)
  }
}
