'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getContext, STORE_COOKIE } from '@/lib/context'
import { findCountry } from '@/lib/countries'
import { slugify } from '@/lib/utils'
import type { FormState } from '@/lib/form'

export async function createStore(_: FormState, fd: FormData): Promise<FormState> {
  const name = String(fd.get('name') ?? '').trim()
  const slug = slugify(String(fd.get('slug') ?? ''), 40)
  const country = findCountry(String(fd.get('country') ?? ''))

  if (name.length < 2) return { error: 'Le nom de la boutique est trop court.' }
  if (slug.length < 2) return { error: 'Choisis une adresse (sous-domaine) d’au moins 2 caractères.' }
  if (!country) return { error: 'Choisis ton pays de vente principal.' }

  const { supabase } = await getContext()
  const { data, error } = await supabase.rpc('create_store', {
    p_name: name,
    p_slug: slug,
    p_market: {
      name: country.name,
      country_code: country.code,
      currency: country.currency,
      phone_prefix: country.prefix,
      shipping_fee: 0,
      cities: country.cities,
    },
  })

  if (error) {
    if (error.code === '23505') return { error: 'Cette adresse est déjà prise. Essaie une variante.' }
    if (error.message.includes('slug_reserved')) return { error: 'Cette adresse est réservée. Choisis-en une autre.' }
    return { error: 'Impossible de créer la boutique. Réessaie.' }
  }

  const jar = await cookies()
  jar.set(STORE_COOKIE, String(data), { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  redirect('/dashboard')
}
