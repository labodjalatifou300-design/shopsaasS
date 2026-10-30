import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function removeLegacyMetaCredentials(builderJson: Record<string, any>) {
  const safe = { ...builderJson }
  if (safe.themeSettings && typeof safe.themeSettings === 'object' && !Array.isArray(safe.themeSettings)) {
    safe.themeSettings = { ...safe.themeSettings }
    delete safe.themeSettings.meta_capi_token
    delete safe.themeSettings.meta_pixel_id
  }
  return safe
}

async function getStorePermissions(
  admin: ReturnType<typeof getAdminClient>,
  storeId: string,
  userId: string,
) {
  const [{ data: store }, { data: membership }] = await Promise.all([
    admin.from('stores').select('owner_id').eq('id', storeId).maybeSingle(),
    admin.from('store_members').select('roles(permissions)').eq('store_id', storeId).eq('user_id', userId).maybeSingle(),
  ])
  if (!store) return [] as string[]
  if (store.owner_id === userId) return ['*']
  const role = Array.isArray((membership as any)?.roles) ? (membership as any).roles[0] : (membership as any)?.roles
  return Array.isArray(role?.permissions) ? role.permissions as string[] : []
}

function hasPermission(permissions: string[], permission: string) {
  return permissions.includes('*') || permissions.includes(permission)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const { storeId, builderJson, isPublished, status } = body
    if (!storeId) return NextResponse.json({ error: 'storeId requis' }, { status: 400 })
    // Guard contre un builderJson null qui effacerait le contenu
    if (builderJson === null || builderJson === undefined) {
      return NextResponse.json({ error: 'builderJson ne peut pas être null.' }, { status: 400 })
    }
    const safeBuilderJson = removeLegacyMetaCredentials(builderJson)

    const admin = getAdminClient()

    // ── CAS 1 : storeId est un store_pages.id (éditeur de page) ─────────────
    const { data: existingPage } = await admin
      .from('store_pages').select('id, store_id').eq('id', storeId).maybeSingle()

    if (existingPage) {
      const permissions = await getStorePermissions(admin, existingPage.store_id, user.id)
      if (!hasPermission(permissions, 'pages.write')) {
        return NextResponse.json({ error: 'Ton rôle ne permet pas de modifier les pages de cette boutique.' }, { status: 403 })
      }

      // Sauvegarder le builder_json de CETTE page
      const { error: pageError } = await admin
        .from('store_pages')
        .update({
          builder_json: safeBuilderJson,
          ...(typeof isPublished === 'boolean' ? { is_published: isPublished } : {}),
          ...(status ? { is_published: status === 'published' } : {}),
        })
        .eq('id', storeId)

      if (pageError) {
        console.error('[save] page update error:', pageError.message)
        return NextResponse.json({ error: pageError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // ── CAS 2 : storeId est un stores.id (boutique principale) ───────────────
    const { data: store } = await admin
      .from('stores').select('id, owner_id').eq('id', storeId).maybeSingle()

    if (!store) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })

    const permissions = await getStorePermissions(admin, storeId, user.id)
    if (!hasPermission(permissions, 'pages.write')) {
      return NextResponse.json({ error: 'Ton rôle ne permet pas de modifier les pages de cette boutique.' }, { status: 403 })
    }
    if (status && !hasPermission(permissions, 'settings.write')) {
      return NextResponse.json({ error: 'Ton rôle ne permet pas de changer le statut de la boutique.' }, { status: 403 })
    }
    if (status && !['draft', 'published', 'paused'].includes(status)) {
      return NextResponse.json({ error: 'Statut de boutique invalide.' }, { status: 400 })
    }

    // Upsert la page home
    const { error: pageError } = await admin
      .from('store_pages')
      .upsert(
        {
          store_id: storeId,
          slug: 'home',
          title: 'Accueil',
          builder_json: safeBuilderJson,
          ...(typeof isPublished === 'boolean' ? { is_published: isPublished } : {}),
        },
        { onConflict: 'store_id,slug' }
      )

    if (pageError) {
      console.error('[save] page upsert error:', pageError.message)
      return NextResponse.json({ error: pageError.message }, { status: 500 })
    }

    if (status) {
      await admin.from('stores').update({ status }).eq('id', storeId)
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[stores/save] crash:', err.message)
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 })
  }
}
