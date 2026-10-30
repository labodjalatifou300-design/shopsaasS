import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildStorePage } from '@/lib/store-builder/boutique-themes'
import { findCountry } from '@/lib/countries'

/**
 * POST /api/stores/clone
 * Clone une boutique en ligne via son URL :
 * - Scrape la page pour extraire les informations de base
 * - Crée une nouvelle boutique avec le thème par défaut
 * Body: { url: string, country_code: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { url, country_code } = body
    const country = findCountry(String(country_code ?? ''))

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL requise' }, { status: 400 })
    }
    if (!country) {
      return NextResponse.json({ error: 'Choisis le marché de cette boutique avant de la créer.' }, { status: 400 })
    }

    // Normaliser l'URL
    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`
    }

    let analysis: Record<string, any> = {
      fonts_detected: [],
      logo_detected: false,
      product_extracted: false,
      images_extracted: 0,
      product_images: 0,
      headings_detected: 0,
      testimonials_extracted: 0,
      faq_extracted: 0,
    }

    let storeName = 'Boutique clonée'
    let slug = `clone-${Date.now()}`

    // Scrape basique de la page
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShopSaaS/1.0)',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        const html = await response.text()

        // Extraire le titre
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (titleMatch) {
          storeName = titleMatch[1].trim().slice(0, 60)
        }

        // Détecter les headings
        const headings = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || []
        analysis.headings_detected = headings.length

        // Détecter les polices Google
        const fontMatches = html.match(/family=([^&"']+)/g) || []
        analysis.fonts_detected = [...new Set(fontMatches.map(f => f.replace('family=', '').split(':')[0]))]

        // Détecter les images
        const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || []
        analysis.images_extracted = Math.min(imgMatches.length, 10)

        // Détecter logo
        analysis.logo_detected = html.toLowerCase().includes('logo')
      }
    } catch (_scrapeErr) {
      // Ignorer les erreurs de scraping
    }

    // Générer un slug unique
    slug = storeName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40)

    // S'assurer que le slug est unique
    const baseSlug = slug
    let counter = 0
    while (true) {
      const testSlug = counter === 0 ? baseSlug : `${baseSlug}-${counter}`
      const { data: existing } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', testSlug)
        .maybeSingle()
      if (!existing) {
        slug = testSlug
        break
      }
      counter++
    }

    // Créer la boutique et son marché ensemble via la même RPC.
    const { data: storeId, error: storeError } = await supabase.rpc('create_store', {
      p_name: storeName,
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
    if (storeError || !storeId) {
      return NextResponse.json({ error: storeError?.message || 'Erreur création boutique et marché' }, { status: 500 })
    }

    // Créer les paramètres
    const { error: settingsError } = await supabase.from('store_settings').upsert(
      { store_id: storeId, theme_id: 'nature-vert' },
      { onConflict: 'store_id' },
    )
    if (settingsError) console.error('[API /stores/clone] Settings:', settingsError.message)

    // Générer le builder_json
    const builderJson = buildStorePage('nature-vert', storeName, null)

    // Créer la page home
    const { error: pageError } = await supabase.from('store_pages').upsert({
      store_id: storeId,
      title: 'Accueil',
      slug: 'home',
      is_published: false,
      builder_json: builderJson,
    }, { onConflict: 'store_id,slug' })
    if (pageError) console.error('[API /stores/clone] Home page:', pageError.message)

    return NextResponse.json({
      data: { id: storeId, name: storeName, slug, country_code: country.code, currency: country.currency },
      analysis,
    })
  } catch (err: any) {
    console.error('[API /stores/clone] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 })
  }
}
