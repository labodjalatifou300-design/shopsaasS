'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { logActivity, requirePerm } from '@/lib/context'
import { slugify } from '@/lib/utils'

/** Crée un brouillon vide puis ouvre directement la page d'édition. */
export async function createBlankProduct() {
  const { supabase, store } = await requirePerm('products.write')
  const slug = `produit-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

  const { data, error } = await supabase
    .from('products')
    .insert({ store_id: store.id, title: 'Nouveau produit', slug, description: '', status: 'draft' })
    .select('id')
    .single()
  if (error || !data) redirect('/dashboard/products?erreur=creation')

  await supabase.from('variants').insert({ product_id: data.id, store_id: store.id, title: 'Défaut', position: 0, stock: 0 })
  redirect(`/dashboard/products/${data.id}`)
}

const PayloadSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est obligatoire.').max(200, 'Titre trop long (200 caractères max).'),
  description: z.string().max(100000, 'Description trop longue.'),
  status: z.enum(['active', 'draft']),
  images: z.array(z.string().url()).max(20, '20 médias maximum.'),
  price: z.number().min(0).nullable(),
  compareAt: z.number().min(0).nullable(),
  stock: z.number().int('Le stock doit être un nombre entier.').min(0, 'Le stock ne peut pas être négatif.'),
})

export type SimpleProductPayload = z.infer<typeof PayloadSchema>

const AUTO_SLUG = /^produit-[a-z0-9]+$/

export async function saveSimpleProduct(productId: string, payload: SimpleProductPayload): Promise<{ error: string } | { ok: true }> {
  const { supabase, store } = await requirePerm('products.write')
  const parsed = PayloadSchema.safeParse(payload)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  const p = parsed.data

  if (p.compareAt !== null && p.price !== null && p.compareAt <= p.price) {
    return { error: 'Le prix avant réduction doit être plus élevé que le prix actuel.' }
  }
  if (p.status === 'active' && p.price === null) {
    return { error: 'Ajoute un prix actuel avant de mettre le produit en Actif.' }
  }

  const { data: current } = await supabase.from('products').select('id, slug').eq('id', productId).eq('store_id', store.id).maybeSingle()
  if (!current) return { error: 'Produit introuvable.' }

  const { data: market } = await supabase
    .from('markets')
    .select('id')
    .eq('store_id', store.id)
    .eq('active', true)
    .eq('is_default', true)
    .maybeSingle()
  if (p.price !== null && !market) return { error: 'Configure d’abord un marché pour enregistrer un prix.' }

  // Le lien public suit le titre tant qu'il n'a jamais été personnalisé.
  const baseSlug = AUTO_SLUG.test(current.slug as string) && p.title !== 'Nouveau produit' ? slugify(p.title) || (current.slug as string) : (current.slug as string)
  let saved = false
  for (let attempt = 0; attempt < 5 && !saved; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const { error } = await supabase
      .from('products')
      .update({ title: p.title, description: p.description, status: p.status, images: p.images, slug, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('store_id', store.id)
    if (!error) saved = true
    else if (error.code !== '23505') return { error: 'Enregistrement impossible, réessaie.' }
  }
  if (!saved) return { error: 'Enregistrement impossible, réessaie.' }

  // Une seule variante : elle porte le stock et les prix.
  const { data: firstVariant } = await supabase.from('variants').select('id').eq('product_id', productId).order('position').limit(1).maybeSingle()
  let variantId = firstVariant?.id as string | undefined
  if (variantId) {
    const { error } = await supabase.from('variants').update({ stock: p.stock }).eq('id', variantId).eq('store_id', store.id)
    if (error) return { error: 'Le stock n’a pas pu être enregistré.' }
  } else {
    const { data, error } = await supabase
      .from('variants')
      .insert({ product_id: productId, store_id: store.id, title: 'Défaut', position: 0, stock: p.stock })
      .select('id')
      .single()
    if (error || !data) return { error: 'Le stock n’a pas pu être enregistré.' }
    variantId = data.id as string
  }

  if (market) {
    if (p.price === null) {
      await supabase.from('variant_prices').delete().eq('variant_id', variantId).eq('market_id', market.id)
    } else {
      const { error } = await supabase
        .from('variant_prices')
        .upsert(
          { variant_id: variantId, market_id: market.id, store_id: store.id, price: p.price, compare_at_price: p.compareAt },
          { onConflict: 'variant_id,market_id' },
        )
      if (error) return { error: 'Les prix n’ont pas pu être enregistrés.' }
    }
  }

  await logActivity(store.id, 'product.updated', { title: p.title })
  revalidatePath('/dashboard/products')
  revalidatePath(`/dashboard/products/${productId}`)
  return { ok: true }
}
