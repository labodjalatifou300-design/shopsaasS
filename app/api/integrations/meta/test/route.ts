import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Les événements de test Meta sont désactivés dans ShopSaaS.' },
    { status: 410 },
  )
}
