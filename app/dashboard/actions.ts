'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getContext, STORE_COOKIE } from '@/lib/context'

export async function switchStore(fd: FormData) {
  const storeId = String(fd.get('store_id') ?? '')
  const { memberships } = await getContext()
  if (!memberships.some((m) => m.store_id === storeId)) redirect('/dashboard')
  const jar = await cookies()
  jar.set(STORE_COOKIE, storeId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  redirect('/dashboard')
}
