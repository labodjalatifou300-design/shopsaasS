'use client'

import { useState } from 'react'
import { ActionForm, SubmitButton } from '@/components/form'
import { Field, Input, Select } from '@/components/ui'
import { COUNTRIES } from '@/lib/countries'
import { ROOT_DOMAIN, slugify } from '@/lib/utils'
import { createStore } from './actions'

export function StoreForm() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const shownSlug = slugTouched ? slug : slugify(name, 40)
  const [country, setCountry] = useState('TG')
  const selectedCountry = COUNTRIES.find((item) => item.code === country) ?? COUNTRIES[0]

  return (
    <ActionForm action={createStore} className="space-y-4">
      <Field label="Nom de la boutique">
        <Input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Labo Beauté" required />
      </Field>
      <Field label="Adresse de la boutique" hint={`${shownSlug || 'maboutique'}.${ROOT_DOMAIN}`}>
        <Input
          name="slug"
          value={shownSlug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(slugify(e.target.value, 40))
          }}
          placeholder="maboutique"
          required
        />
      </Field>
      <Field label="Pays de vente" hint="La devise, l’indicatif et les réglages de base sont détectés automatiquement.">
        <Select name="country" value={country} onChange={(e) => setCountry(e.target.value)}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.currency})
            </option>
          ))}
        </Select>
      </Field>
      <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900">
        <p className="font-semibold">{selectedCountry.name} · {selectedCountry.currency}</p>
        <p className="mt-1 text-xs text-violet-700">Indicatif {selectedCountry.prefix} · {selectedCountry.cities.length ? `${selectedCountry.cities.length} villes proposées` : 'villes à ajouter selon ta zone de livraison'}</p>
      </div>
      <SubmitButton className="w-full" pendingLabel="Création de la boutique…">
        Créer ma boutique
      </SubmitButton>
    </ActionForm>
  )
}
