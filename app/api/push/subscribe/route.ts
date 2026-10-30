import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function allowedPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    return [
      'fcm.googleapis.com',
      'push.services.mozilla.com',
      'web.push.apple.com',
      'wns.windows.com',
      'notify.windows.com',
    ].some(domain => host === domain || host.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

function hasOrderPermission(row: any) {
  const role = Array.isArray(row?.roles) ? row.roles[0] : row?.roles
  const permissions = Array.isArray(role?.permissions) ? role.permissions : []
  return permissions.includes('*') || permissions.includes('orders.read')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const storeId = typeof body?.storeId === 'string' ? body.storeId : ''
    const subscription = body?.subscription
    const endpoint = subscription?.endpoint
    const p256dh = subscription?.keys?.p256dh
    const auth = subscription?.keys?.auth
    if (!storeId || !allowedPushEndpoint(endpoint) || typeof p256dh !== 'string' || typeof auth !== 'string') {
      return NextResponse.json({ error: 'Abonnement push invalide.' }, { status: 400 })
    }

    const { data: membership } = await supabase
      .from('store_members')
      .select('store_id, roles(permissions)')
      .eq('store_id', storeId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership || !hasOrderPermission(membership)) {
      return NextResponse.json({ error: 'Tu n’as pas accès aux commandes de cette boutique.' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('web_push_subscriptions')
      .upsert({
        store_id: storeId,
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'store_id,user_id,endpoint' })
    if (error) {
      console.error('[push/subscribe] save failed:', error.message)
      return NextResponse.json({ error: 'Impossible d’enregistrer cet appareil.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[push/subscribe] error:', error)
    return NextResponse.json({ error: 'Erreur lors de l’activation des notifications.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const storeId = typeof body?.storeId === 'string' ? body.storeId : ''
    const endpoint = body?.endpoint
    if (!storeId || !allowedPushEndpoint(endpoint)) {
      return NextResponse.json({ error: 'Abonnement push invalide.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('web_push_subscriptions')
      .delete()
      .eq('store_id', storeId)
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
    if (error) return NextResponse.json({ error: 'Impossible de retirer cet appareil.' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[push/subscribe] delete failed:', error)
    return NextResponse.json({ error: 'Erreur lors du retrait de cet appareil.' }, { status: 500 })
  }
}
