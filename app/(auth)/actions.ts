'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrigin } from '@/lib/context'
import { safeNext } from '@/lib/utils'
import type { FormState } from '@/lib/form'

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const password = String(fd.get('password') ?? '')
  const next = safeNext(fd.get('next'))
  if (!email || !password) return { error: 'Email et mot de passe requis.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Email ou mot de passe incorrect.' }
  redirect(next ?? '/dashboard')
}

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const fullName = String(fd.get('full_name') ?? '').trim()
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const password = String(fd.get('password') ?? '')
  const next = safeNext(fd.get('next'))
  if (fullName.length < 2) return { error: 'Indique ton nom.' }
  if (!email.includes('@')) return { error: 'Email invalide.' }
  if (password.length < 8) return { error: 'Le mot de passe doit faire au moins 8 caractères.' }

  const supabase = await createClient()
  const origin = await getOrigin()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next ?? '/onboarding')}`,
    },
  })
  if (error) {
    if (error.message.toLowerCase().includes('registered')) return { error: 'Un compte existe déjà avec cet email.' }
    return { error: 'Inscription impossible. Réessaie.' }
  }
  if (!data.session) return { message: 'Compte créé. Confirme ton email via le lien reçu, puis connecte-toi.' }
  redirect(next ?? '/onboarding')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
