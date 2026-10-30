'use server'

import { revalidatePath } from 'next/cache'
import { logActivity, requirePerm } from '@/lib/context'
import type { FormState } from '@/lib/form'

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, store } = await requirePerm('settings.write')
  const name = String(fd.get('name') ?? '').trim()
  const primary_color = String(fd.get('primary_color') ?? '#7c3aed')
  const whatsapp = String(fd.get('whatsapp') ?? '').replace(/[^\d+]/g, '') || null
  const logo_url = String(fd.get('logo_url') ?? '') || null

  if (name.length < 2) return { error: 'Nom trop court.' }
  if (!/^#[0-9a-fA-F]{6}$/.test(primary_color)) return { error: 'Couleur invalide.' }

  const { error } = await supabase.from('stores').update({ name, primary_color, whatsapp, logo_url }).eq('id', store.id)
  if (error) return { error: 'Enregistrement impossible.' }
  await logActivity(store.id, 'settings.updated')
  revalidatePath('/dashboard', 'layout')
  return { message: 'Réglages enregistrés.' }
}
