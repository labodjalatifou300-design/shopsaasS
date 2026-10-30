import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/utils'

/** Lien de confirmation d'email Supabase */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next')) ?? '/dashboard'
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}${next}`)
}
