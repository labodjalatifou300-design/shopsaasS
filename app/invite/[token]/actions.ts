'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { STORE_COOKIE } from '@/lib/context'
import type { FormState } from '@/lib/form'

const ERRORS: Record<string, string> = {
  invitation_not_found: 'Invitation introuvable.',
  invitation_used: 'Cette invitation a déjà été utilisée.',
  invitation_expired: 'Cette invitation a expiré. Demande un nouveau lien.',
  invitation_email_mismatch: 'Cette invitation est destinée à un autre email. Connecte-toi avec le bon compte.',
}

export async function acceptInvitation(token: string, _: FormState): Promise<FormState> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('accept_invitation', { p_token: token })
  if (error) {
    const key = Object.keys(ERRORS).find((k) => error.message.includes(k))
    return { error: key ? ERRORS[key] : 'Impossible de rejoindre la boutique.' }
  }
  const jar = await cookies()
  jar.set(STORE_COOKIE, String(data), { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  redirect('/dashboard')
}
