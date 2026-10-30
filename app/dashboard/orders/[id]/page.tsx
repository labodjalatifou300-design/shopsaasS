import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requirePerm } from '@/lib/context'
import { Badge, Card, PageHeader } from '@/components/ui'
import { formatMoney } from '@/lib/utils'
import { updateOrderStatus, saveOrderNote } from '../actions'
import { ArrowLeft, Phone, MapPin, User, Package, Clock, CheckCircle, XCircle, Truck, RotateCcw, AlertCircle } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  unreachable: 'Injoignable',
  scheduled: 'Programmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  returned: 'Retournée',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  new: { bg: 'bg-violet-100', text: 'text-violet-700', icon: Clock },
  confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  unreachable: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
  shipped: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Truck },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  cancelled: { bg: 'bg-zinc-100', text: 'text-zinc-600', icon: XCircle },
  returned: { bg: 'bg-red-100', text: 'text-red-600', icon: RotateCcw },
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, store } = await requirePerm('orders.read')

  const [{ data: order }, { data: events }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, markets(currency, name)')
      .eq('id', id)
      .eq('store_id', store.id)
      .maybeSingle(),
    supabase
      .from('order_events')
      .select('event_type, note, created_at')
      .eq('order_id', id)
      .eq('store_id', store.id)
      .order('created_at', { ascending: false }),
  ])
  if (!order) notFound()

  const currency = order.markets?.currency ?? 'XOF'
  const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.new
  const StatusIcon = style.icon

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard/orders" className="flex items-center gap-1.5 hover:text-violet-700 transition-colors">
          <ArrowLeft className="size-4" />
          Commandes
        </Link>
        <span>/</span>
        <span className="font-medium text-zinc-800">{order.order_number}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">{order.order_number}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {new Date(order.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-sm ${style.bg} ${style.text}`}>
          <StatusIcon className="size-4" />
          {STATUS_LABELS[order.status] ?? order.status}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        {/* Colonne principale */}
        <div className="space-y-5">
          {/* Infos client */}
          <Card>
            <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <User className="size-4 text-zinc-400" /> Client
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="flex items-start gap-3">
                <User className="size-4 text-zinc-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">Nom complet</p>
                  <p className="font-medium text-zinc-800">{order.customer_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="size-4 text-zinc-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">Téléphone</p>
                  <a href={`tel:${order.customer_phone}`} className="font-medium text-violet-700 hover:underline">
                    {order.customer_phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-zinc-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">Ville / Quartier</p>
                  <p className="font-medium text-zinc-800">{order.customer_city || '—'}</p>
                </div>
              </div>
              {order.customer_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-400 mb-0.5">Adresse</p>
                    <p className="font-medium text-zinc-800">{order.customer_address}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Produits commandés */}
          <Card>
            <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Package className="size-4 text-zinc-400" /> Produits commandés
            </h2>
            {order.lines && Array.isArray(order.lines) && order.lines.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {order.lines.map((line: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {line.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.image} alt={line.title} className="size-12 rounded-lg object-cover border border-zinc-100" />
                      )}
                      <div>
                        <p className="font-medium text-zinc-800 text-sm">{line.title ?? line.product_title ?? 'Produit'}</p>
                        {line.variant && <p className="text-xs text-zinc-400">{line.variant}</p>}
                        <p className="text-xs text-zinc-500">Qté : {line.quantity ?? 1}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-zinc-800 text-sm">
                      {formatMoney((line.price ?? 0) * (line.quantity ?? 1), currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-400">
                Détail des produits non disponible
              </div>
            )}
            <div className="mt-4 border-t border-zinc-100 pt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700">Total commande</span>
              <span className="text-lg font-bold text-violet-700">{formatMoney(order.total, currency)}</span>
            </div>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-5">
          {/* Changer le statut */}
          <Card>
            <h2 className="font-semibold text-zinc-900 mb-4">Modifier le statut</h2>
            <form
              action={async (fd: FormData) => {
                'use server'
                await updateOrderStatus(id, String(fd.get('status')), String(fd.get('note') ?? ''))
              }}
              className="space-y-4"
            >
              {/* Boutons de statut colorés */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'new',         label: 'Nouvelle',     color: 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200' },
                  { key: 'confirmed',   label: 'Confirmée',    color: 'bg-emerald-600 hover:bg-emerald-700' },
                  { key: 'unreachable', label: 'Injoignable',  color: 'bg-orange-500 hover:bg-orange-600' },
                  { key: 'scheduled',   label: 'Programmée',   color: 'bg-blue-600 hover:bg-blue-700' },
                  { key: 'shipped',     label: 'Expédiée',     color: 'bg-amber-500 hover:bg-amber-600' },
                  { key: 'delivered',   label: 'Livrée',       color: 'bg-green-600 hover:bg-green-700' },
                  { key: 'cancelled',   label: 'Annulée',      color: 'bg-red-600 hover:bg-red-700' },
                  { key: 'returned',    label: 'Retournée',    color: 'bg-zinc-500 hover:bg-zinc-600' },
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    type="submit"
                    name="status"
                    value={key}
                    className={`
                      relative rounded-xl px-3 py-2.5 text-xs font-bold transition-all
                      ${color}
                      ${order.status === key ? 'ring-2 ring-offset-2 ring-zinc-800 scale-[1.03]' : 'opacity-80 hover:opacity-100'}
                    `}
                  >
                    {label}
                    {order.status === key && (
                      <span className="absolute -top-1 -right-1 size-3 rounded-full bg-white border-2 border-zinc-800" />
                    )}
                  </button>
                ))}
              </div>

              <input type="hidden" name="note" value="" />

              <p className="text-xs text-zinc-400">
                Cliquez sur un statut pour l&apos;appliquer. Vous serez redirigé vers la liste.
              </p>
            </form>
          </Card>

          {/* Historique */}
          <Card>
            <h2 className="font-semibold text-zinc-900 mb-4">Historique</h2>
            {(events ?? []).length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">Aucun événement enregistré</p>
            ) : (
              <div className="space-y-3">
                {(events ?? []).map((event: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1.5 size-2 rounded-full bg-violet-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-800">{event.event_type}</p>
                      {event.note && (
                        <p className="text-xs text-zinc-500 mt-0.5 bg-zinc-50 rounded-lg px-2 py-1">
                          {event.note}
                        </p>
                      )}
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {new Date(event.created_at).toLocaleString('fr-FR', {
                          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Note interne */}
          <Card>
            <h2 className="font-semibold text-zinc-900 mb-3">Note interne</h2>
            <form
              action={async (fd: FormData) => {
                'use server'
                await saveOrderNote(id, String(fd.get('note') ?? ''))
              }}
              className="space-y-3"
            >
              <textarea
                name="note"
                rows={4}
                defaultValue={order.note ?? ''}
                placeholder="Ex: Client a demandé livraison avant midi, allergique au plastique..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm resize-none focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 placeholder:text-zinc-400"
              />
              <button
                type="submit"
                className="w-full bg-zinc-800 hover:bg-zinc-900 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                Enregistrer la note
              </button>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}
