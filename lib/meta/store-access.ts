import type { SupabaseClient, User } from '@supabase/supabase-js'

export async function canManageMetaIntegration(
  sessionClient: SupabaseClient,
  adminClient: SupabaseClient,
  user: User,
  storeId: string,
) {
  const { data: store } = await adminClient
    .from('stores')
    .select('id, owner_id')
    .eq('id', storeId)
    .maybeSingle()

  if (!store) return false
  if (store.owner_id === user.id) return true

  const { data: membership } = await sessionClient
    .from('store_members')
    .select('roles(permissions)')
    .eq('store_id', storeId)
    .eq('user_id', user.id)
    .maybeSingle()

  const role = Array.isArray(membership?.roles) ? membership.roles[0] : membership?.roles
  const permissions = Array.isArray((role as any)?.permissions) ? (role as any).permissions : []
  return permissions.includes('*') || permissions.includes('settings.write')
}
