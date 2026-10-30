import { requirePerm } from '@/lib/context'
import { Badge, Card, PageHeader } from '@/components/ui'
import { markCartContacted } from './actions'

type AbandonedCart = {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_city: string | null
  product_name: string
  quantity: number
  estimated_total: number
  currency: string
  last_seen_at: string
  status: 'active' | 'contacted' | 'converted' | 'dismissed'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default async function AbandonedCartsPage() {
  const { supabase, store, permissions } = await requirePerm('orders.read')
  const { data } = await supabase
    .from('abandoned_carts')
    .select('id, customer_name, customer_phone, customer_email, customer_city, product_name, quantity, estimated_total, currency, last_seen_at, status')
    .eq('store_id', store.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('last_seen_at', { ascending: false })
    .limit(100)
  const carts = (data ?? []) as AbandonedCart[]
  const canContact = permissions.includes('*') || permissions.includes('orders.write')

  return (
    <>
      <PageHeader
        title="Paniers abandonnés"
        subtitle={`Coordonnées enregistrées uniquement après l’accord du visiteur · ${carts.length} panier${carts.length === 1 ? '' : 's'} à suivre`}
      />
      {carts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-base font-semibold">Aucun panier abandonné pour le moment</p>
          <p className="mt-2 text-sm text-zinc-500">Les visiteurs doivent cocher la case de consentement avant que leur panier puisse apparaître ici.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {carts.map(cart => (
            <Card key={cart.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-bold">{cart.customer_name}</p>
                  <Badge color="orange">À recontacter</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{cart.product_name} · {cart.quantity} × · {Number(cart.estimated_total).toLocaleString('fr-FR')} {cart.currency}</p>
                <p className="mt-1 text-sm text-zinc-500">{cart.customer_city || 'Ville non indiquée'} · Dernière activité : {formatDate(cart.last_seen_at)}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
                  <a className="text-violet-700 underline underline-offset-2" href={`tel:${encodeURIComponent(cart.customer_phone)}`}>{cart.customer_phone}</a>
                  {cart.customer_email && <a className="text-violet-700 underline underline-offset-2" href={`mailto:${encodeURIComponent(cart.customer_email)}`}>{cart.customer_email}</a>}
                </div>
              </div>
              {canContact && (
                <form action={markCartContacted.bind(null, cart.id)}>
                  <button type="submit" className="min-h-11 shrink-0 rounded-xl border border-zinc-200 px-4 text-sm font-semibold hover:bg-zinc-50">
                    Marquer « contacté »
                  </button>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-zinc-500">
        Ces coordonnées ne sont visibles que pour les membres ayant accès aux commandes. Les paniers expirent après 30 jours; la suppression automatique dépend de la disponibilité de pg_cron dans Supabase.
      </p>
    </>
  )
}
