'use client'

import { useState } from 'react'
import { ActionForm, SubmitButton } from '@/components/form'
import { Field, Input, Select, Textarea } from '@/components/ui'
import { COUNTRIES, findCountry } from '@/lib/countries'
import type { FormState } from '@/lib/form'

export type MarketValues = {
  name: string
  country_code: string
  currency: string
  phone_prefix: string
  shipping_fee: number
  cities: string[]
}

export function MarketForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>
  initial?: MarketValues
  submitLabel: string
}) {
  const start = initial ?? {
    name: 'Togo',
    country_code: 'TG',
    currency: 'XOF',
    phone_prefix: '+228',
    shipping_fee: 0,
    cities: findCountry('TG')?.cities ?? [],
  }
  const [v, setV] = useState(start)

  function pickCountry(code: string) {
    const c = findCountry(code)
    if (!c) return
    setV((prev) => ({ ...prev, country_code: c.code, name: c.name, currency: c.currency, phone_prefix: c.prefix, cities: c.cities }))
  }

  return (
    <ActionForm action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Pays">
        <Select name="country_code" value={v.country_code} disabled={!!initial} onChange={(e) => pickCountry(e.target.value)}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Nom affiché">
        <Input name="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />
      </Field>
      <Field label="Devise">
        <Input name="currency" value={v.currency} readOnly required />
      </Field>
      <Field label="Indicatif téléphone">
        <Input name="phone_prefix" value={v.phone_prefix} readOnly required />
      </Field>
      <Field label="Frais de livraison" hint="0 = gratuit">
        <Input name="shipping_fee" type="number" min={0} step="any" value={v.shipping_fee} onChange={(e) => setV({ ...v, shipping_fee: Number(e.target.value) })} />
      </Field>
      {!!initial && <p className="self-end pb-2 text-xs text-zinc-500">Cette boutique reste liée à ce marché et à cette devise.</p>}
      {initial && <input type="hidden" name="country_code" value={v.country_code} />}
      <div className="sm:col-span-2">
        <Field label="Villes de livraison" hint="Une ville par ligne. Elles apparaîtront dans le formulaire de commande.">
          <Textarea name="cities" rows={5} value={v.cities.join('\n')} onChange={(e) => setV({ ...v, cities: e.target.value.split('\n') })} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  )
}
