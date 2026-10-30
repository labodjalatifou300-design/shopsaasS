import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageMetaIntegration } from '@/lib/meta/store-access'

const PIXEL_ID_PATTERN = /^\d{5,25}$/

async function getAuthorizedStore(request: NextRequest, storeId: string) {
  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) return { response: NextResponse.json({ error: 'Connecte-toi pour gérer cette intégration.' }, { status: 401 }) }

  const admin = createAdminClient()
  if (!(await canManageMetaIntegration(sessionClient, admin, user, storeId))) {
    return { response: NextResponse.json({ error: 'Il faut le droit « Réglages de la boutique » pour modifier Meta.' }, { status: 403 }) }
  }
  return { admin, user }
}

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('storeId') || ''
  if (!storeId) return NextResponse.json({ error: 'Boutique manquante.' }, { status: 400 })

  try {
    const access = await getAuthorizedStore(request, storeId)
    if ('response' in access) return access.response
    const { data, error } = await access.admin
      .from('store_meta_integrations')
      .select('pixel_id, access_token_secret_id, test_event_code, test_mode')
      .eq('store_id', storeId)
      .maybeSingle()
    if (error) throw error

    return NextResponse.json({
      pixelId: data?.pixel_id ?? '',
      capiConnected: Boolean(data?.access_token_secret_id),
      testEventCode: data?.test_event_code ?? '',
      testMode: data?.test_mode ?? false,
    })
  } catch (error) {
    console.error('[meta/settings] load failed:', error)
    return NextResponse.json({ error: 'Impossible de charger les réglages Meta.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const storeId = typeof body?.storeId === 'string' ? body.storeId : ''
  if (!storeId) return NextResponse.json({ error: 'Boutique manquante.' }, { status: 400 })

  try {
    const access = await getAuthorizedStore(request, storeId)
    if ('response' in access) return access.response
    const pixelId = typeof body.pixelId === 'string' ? body.pixelId.trim() : ''
    const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : ''
    // Production-only integration: never persist or send Meta test events.
    const testEventCode = ''
    const testMode = false

    if (!pixelId) {
      const { error } = await access.admin.rpc('delete_store_meta_integration', { p_store_id: storeId })
      if (error) throw error
      return NextResponse.json({ ok: true, removed: true })
    }
    if (!PIXEL_ID_PATTERN.test(pixelId)) {
      return NextResponse.json({ error: 'Le Pixel ID doit contenir uniquement des chiffres.' }, { status: 400 })
    }
    if (accessToken && (accessToken.length < 20 || accessToken.length > 4096)) {
      return NextResponse.json({ error: 'Le token Meta semble incomplet ou trop long.' }, { status: 400 })
    }
    if (testEventCode && !/^[A-Za-z0-9_-]{4,80}$/.test(testEventCode)) {
      return NextResponse.json({ error: 'Le code de test Meta contient des caractères non autorisés.' }, { status: 400 })
    }
    if (testMode && !testEventCode) {
      return NextResponse.json({ error: 'Ajoute le code de test affiché dans Meta Events Manager.' }, { status: 400 })
    }

    const { data: existing, error: existingError } = await access.admin
      .from('store_meta_integrations')
      .select('access_token_secret_id')
      .eq('store_id', storeId)
      .maybeSingle()
    if (existingError) throw existingError
    if (!accessToken && !existing?.access_token_secret_id) {
      return NextResponse.json({ error: 'Colle ton token CAPI avant d’enregistrer. Il ne sera ensuite jamais réaffiché.' }, { status: 400 })
    }

    const { error } = await access.admin.rpc('save_store_meta_integration', {
      p_store_id: storeId,
      p_pixel_id: pixelId,
      p_access_token: accessToken || null,
      p_test_event_code: testEventCode || null,
      p_test_mode: testMode,
    })
    if (error) throw error

    return NextResponse.json({ ok: true, capiConnected: true })
  } catch (error) {
    console.error('[meta/settings] save failed:', error)
    return NextResponse.json({ error: 'Impossible d’enregistrer Meta. Vérifie la migration SQL et réessaie.' }, { status: 500 })
  }
}
