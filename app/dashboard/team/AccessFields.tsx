'use client'

import { useState } from 'react'
import { Checkbox, Field, Select } from '@/components/ui'

export type RoleOption = { id: string; name: string; description: string | null }
export type MarketOption = { id: string; name: string }

/** Rôle + restrictions (marchés, commandes assignées, numéros masqués) */
export function AccessFields({
  roles,
  markets,
  initial,
}: {
  roles: RoleOption[]
  markets: MarketOption[]
  initial?: { role_id: string; market_ids: string[] | null; only_assigned: boolean; mask_phones: boolean }
}) {
  const [roleId, setRoleId] = useState(initial?.role_id ?? roles[0]?.id ?? '')
  const [allMarkets, setAllMarkets] = useState(initial ? initial.market_ids === null : true)
  const role = roles.find((r) => r.id === roleId)

  return (
    <div className="space-y-4">
      <Field label="Rôle" hint={role?.description ?? undefined}>
        <Select name="role_id" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </Field>

      {markets.length > 1 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Marché accessible</span>
          <Checkbox name="all_markets" label="Accès au marché de cette boutique" checked={allMarkets} onChange={(e) => setAllMarkets(e.target.checked)} />
          {!allMarkets && (
            <div className="grid gap-2 pl-6 sm:grid-cols-2">
              {markets.map((m) => (
                <Checkbox key={m.id} name="market_ids" value={m.id} label={m.name} defaultChecked={initial?.market_ids?.includes(m.id) ?? false} />
              ))}
            </div>
          )}
        </div>
      )}
      {markets.length <= 1 && <input type="hidden" name="all_markets" value="on" />}

      <div className="space-y-2">
        <Checkbox name="only_assigned" label="Ne voit que les commandes qui lui sont assignées" defaultChecked={initial?.only_assigned ?? false} />
        <Checkbox name="mask_phones" label="Masquer les numéros des clients (appel via le bouton uniquement)" defaultChecked={initial?.mask_phones ?? false} />
      </div>
    </div>
  )
}
