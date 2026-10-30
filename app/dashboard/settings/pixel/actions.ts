'use server'

import { revalidatePath } from 'next/cache'
import { requirePerm } from '@/lib/context'
import type { FormState } from '@/lib/form'

export async function savePixelSettings(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, store } = await requirePerm('settings.write')

  const fb_pixel_id = String(fd.get('fb_pixel_id') ?? '').trim() || null
  const fb_access_token = String(fd.get('fb_access_token') ?? '').trim() || null

  const { error } = await supabase
    .from('store_settings')
    .upsert(
      { store_id: store.id, fb_pixel_id, fb_access_token },
      { onConflict: 'store_id' }
    )

  if (error) return { error: 'Enregistrement impossible : ' + error.message }

  revalidatePath('/dashboard/settings/pixel')
  return { message: 'Pixel enregistré avec succès.' }
}
