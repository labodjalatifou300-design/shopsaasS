'use server'

import { revalidatePath } from 'next/cache'
import { getOrigin, logActivity, requirePerm } from '@/lib/context'
import type { FormState } from '@/lib/form'

// Kept only for compatibility with any stale page bundle. It deliberately
// never creates users or changes passwords; new access is granted by invite.
export async function addMemberDirect(_: FormState, _fd: FormData): Promise<FormState> {
  await requirePerm('team.write')
  return { error: 'La création directe de comptes est désactivée. Crée une invitation et partage son lien.' }
}

export async function createInvitation(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const roleId = String(fd.get('role_id') ?? '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Adresse email invalide.' }
  if (!roleId) return { error: 'Choisis un rôle.' }

  const { supabase, store, user } = await requirePerm('team.write')
  const [{ data: role }, { data: existingMember }] = await Promise.all([
    supabase.from('roles').select('id, key, name').eq('id', roleId).eq('store_id', store.id).maybeSingle(),
    supabase.from('store_members').select('user_id').eq('store_id', store.id).ilike('email', email).maybeSingle(),
  ])
  if (!role || role.key === 'owner') return { error: 'Rôle invalide.' }
  if (existingMember) return { error: 'Cette adresse fait déjà partie de cette boutique.' }

  const allMarkets = fd.get('all_markets') === 'on'
  const selectedMarketIds = fd.getAll('market_ids').map(String)
  let marketIds: string[] | null = null
  if (!allMarkets) {
    const { data: markets } = await supabase.from('markets').select('id').eq('store_id', store.id)
    const allowed = new Set((markets ?? []).map((market: any) => market.id))
    if (selectedMarketIds.some(id => !allowed.has(id))) return { error: 'Un marché choisi ne correspond pas à cette boutique.' }
    if (!selectedMarketIds.length) return { error: 'Choisis au moins un marché ou coche « Tous les marchés ».' }
    marketIds = selectedMarketIds
  }

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      store_id: store.id,
      email,
      role_id: role.id,
      market_ids: marketIds,
      only_assigned: fd.get('only_assigned') === 'on',
      mask_phones: fd.get('mask_phones') === 'on',
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('token')
    .single()
  if (error || !invitation) return { error: 'Impossible de créer le lien. Vérifie que cette invitation n’existe pas déjà.' }

  await logActivity(store.id, 'member.invited', { email, role: role.name })
  revalidatePath('/dashboard/team')
  const origin = await getOrigin()
  return {
    message: `Lien prêt pour ${email}, rôle ${role.name}. Envoie-le à la personne.`,
    link: `${origin}/invite/${invitation.token}`,
  }
}

export async function removeMember(userId: string, _: any) {
  const { supabase, store, user } = await requirePerm('team.write')
  if (userId === user.id) return { error: 'Tu ne peux pas te retirer toi-meme ici.' }
  const { data, error } = await supabase
    .from('store_members')
    .delete()
    .eq('store_id', store.id)
    .eq('user_id', userId)
    .select('email')
  if (error || !data?.length) return { error: 'Suppression impossible.' }
  await logActivity(store.id, 'member.removed', { email: data[0].email })
  revalidatePath('/dashboard/team')
  return { message: 'Membre retire.' }
}

export async function updateMemberRole(userId: string, _: any, fd: FormData) {
  const roleId = String(fd.get('role_id') ?? '')
  const { supabase, store } = await requirePerm('team.write')
  const { data: role } = await supabase
    .from('roles')
    .select('id, key, name')
    .eq('id', roleId)
    .eq('store_id', store.id)
    .maybeSingle()
  if (!role || role.key === 'owner') return { error: 'Role invalide.' }
  const { error } = await supabase
    .from('store_members')
    .update({ role_id: role.id })
    .eq('store_id', store.id)
    .eq('user_id', userId)
  if (error) return { error: 'Modification impossible.' }
  revalidatePath('/dashboard/team')
  return { message: 'Role mis a jour.' }
}
