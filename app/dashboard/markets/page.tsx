import { requirePerm } from '@/lib/context'
import { can } from '@/lib/permissions'
import { formatMoney } from '@/lib/utils'
import { Badge, Card, PageHeader } from '@/components/ui'
import { MarketForm, type MarketValues } from './MarketForm'
import { saveMarket } from './actions'

type Market = MarketValues & { id: string }

export default async function MarketsPage() {
  const { supabase, store, permissions } = await requirePerm('markets.read')
  const canEdit = can(permissions, 'markets.write')

  const { data } = await supabase
    .from('markets')
    .select('id, name, country_code, currency, phone_prefix, shipping_fee, cities, is_default, active')
    .eq('store_id', store.id)
    .eq('active', true)
    .limit(1)
  const market = ((data ?? []) as Market[])[0] ?? null

  return (
    <>
      <PageHeader title="Marché de la boutique" subtitle="Chaque boutique possède un seul marché et une seule devise. Les pages et commandes de cette boutique utilisent tous ces réglages." />

      {market ? (
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <h2 className="font-semibold">{market.name}</h2>
            <Badge color="violet">Marché unique · {market.currency}</Badge>
          </div>
          <p className="mb-5 text-sm text-zinc-500">
            Livraison {Number(market.shipping_fee) === 0 ? 'gratuite' : formatMoney(market.shipping_fee, market.currency)} · {market.cities.length} ville{market.cities.length === 1 ? '' : 's'}
          </p>
          {canEdit && (
            <MarketForm
              action={saveMarket.bind(null, market.id)}
              initial={{ ...market, shipping_fee: Number(market.shipping_fee) }}
              submitLabel="Enregistrer les réglages"
            />
          )}
        </Card>
      ) : canEdit ? (
        <Card>
          <h2 className="mb-2 font-semibold">Attribuer un marché</h2>
          <p className="mb-4 text-sm text-amber-700">Cette boutique n’a pas encore de marché actif. Attribue-en un pour que ses pages puissent accepter des commandes.</p>
          <MarketForm action={saveMarket.bind(null, null)} submitLabel="Attribuer ce marché" />
        </Card>
      ) : (
        <Card><p className="text-sm text-amber-700">Aucun marché actif. Demande au propriétaire de cette boutique de lui en attribuer un.</p></Card>
      )}
    </>
  )
}
