'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requirePerm } from '@/lib/context'

const STATUS_LABELS_FR: Record<string, string> = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  unreachable: 'Injoignable',
  scheduled: 'Programmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  returned: 'Retournée',
}

export async function updateOrderStatus(orderId: string, status: string, note = '') {
  const { supabase, store, user } = await requirePerm(
    status === 'shipped' || status === 'delivered' || status === 'returned' ? 'orders.ship' : 'orders.write'
  )
  const allowed = ['new', 'confirmed', 'unreachable', 'scheduled', 'shipped', 'delivered', 'cancelled', 'returned']
  if (!allowed.includes(status)) return { error: 'Statut invalide.' }

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('store_id', store.id)

  if (error) return { error: 'Mise a jour impossible.' }

  // Enregistrer en français dans l'historique
  const label = STATUS_LABELS_FR[status] ?? status
  await supabase.from('order_events').insert({
    order_id: orderId,
    store_id: store.id,
    user_id: user.id,
    event_type: `Statut : ${label}`,
    note: note?.trim() || null,
  })

  revalidatePath('/dashboard/orders')
  redirect('/dashboard/orders')
}

export async function saveOrderNote(orderId: string, note: string) {
  const { supabase, store, user } = await requirePerm('orders.write')

  // Sauvegarder la note dans la commande
  const { error } = await supabase
    .from('orders')
    .update({ note: note.trim() })
    .eq('id', orderId)
    .eq('store_id', store.id)

  if (error) return { error: 'Impossible de sauvegarder la note.' }

  // Ajouter dans l'historique si note non vide
  if (note.trim()) {
    await supabase.from('order_events').insert({
      order_id: orderId,
      store_id: store.id,
      user_id: user.id,
      event_type: 'Note ajoutée',
      note: note.trim(),
    })
  }

  revalidatePath(`/dashboard/orders/${orderId}`)
  return { ok: true }
}

