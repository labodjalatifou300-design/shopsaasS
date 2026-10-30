import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { can, type Permission } from '@/lib/permissions'

export type Store = {
  id: string
  name: string
  slug: string
  owner_id: string
  logo_url: string | null
  primary_color: string
  whatsapp: string | null
}

export type Role = {
  id: string
  key: string | null
  name: string
  description: string | null
  permissions: string[]
}

export type Membership = {
  store_id: string
  market_ids: string[] | null
  only_assigned: boolean
  mask_phones: boolean
  stores: Store
  roles: Role
}

export const STORE_COOKIE = 'sid'

/** Utilisateur connecté + boutiques dont il est membre + boutique courante (mis en cache par requête) */
export const getContext = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('store_members')
    .select(
      'store_id, market_ids, only_assigned, mask_phones, created_at, stores(id, name, slug, owner_id, logo_url, primary_color, whatsapp), roles(id, key, name, description, permissions)',
    )
    .eq('user_id', user.id)
    .order('created_at')

  const memberships = ((data ?? []) as unknown as Membership[]).filter((m) => m.stores && m.roles)
  const jar = await cookies()
  const sid = jar.get(STORE_COOKIE)?.value
  const current = memberships.find((m) => m.store_id === sid) ?? memberships[0] ?? null

  return { supabase, user, memberships, current, permissions: current?.roles.permissions ?? [] }
})

export async function requireStore() {
  const ctx = await getContext()
  if (!ctx.current) redirect('/onboarding')
  return { ...ctx, current: ctx.current, store: ctx.current.stores }
}

export async function requirePerm(p: Permission) {
  const ctx = await requireStore()
  if (!can(ctx.permissions, p)) redirect('/dashboard?refus=1')
  return ctx
}

export async function logActivity(storeId: string, action: string, details: Record<string, unknown> = {}) {
  const { supabase, user } = await getContext()
  await supabase.from('activity_log').insert({ store_id: storeId, user_id: user.id, action, details })
}

export async function getOrigin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
