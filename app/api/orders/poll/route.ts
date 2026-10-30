import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const since = searchParams.get('since')

    if (!storeId || !since) {
      return NextResponse.json({ orders: [] })
    }

    const supabase = await createClient()

    // Vérifier que l'utilisateur est bien membre de cette boutique
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ orders: [] }, { status: 401 })

    const { data: member } = await supabase
      .from('store_members')
      .select('store_id')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .maybeSingle()

    if (!member) return NextResponse.json({ orders: [] }, { status: 403 })

    // Récupérer les commandes créées depuis `since`
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total, created_at, markets(currency)')
      .eq('store_id', storeId)
      .gt('created_at', since)
      .order('created_at', { ascending: true })
      .limit(50)

    const mapped = (orders ?? []).map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer_name,
      total: o.total,
      currency: o.markets?.currency ?? 'XOF',
      created_at: o.created_at,
    }))

    return NextResponse.json({ orders: mapped })
  } catch (err: any) {
    console.error('[orders/poll]', err.message)
    return NextResponse.json({ orders: [] })
  }
}
