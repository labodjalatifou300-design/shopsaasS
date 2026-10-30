'use client'

import { useActionState, useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'
import { SubmitButton } from '@/components/form'
import { Field, Input, buttonClass } from '@/components/ui'
import { createInvitation } from './actions'
import { AccessFields, type MarketOption, type RoleOption } from './AccessFields'

export function InviteForm({ roles, markets, storeName }: { roles: RoleOption[]; markets: MarketOption[]; storeName: string }) {
  const [state, action] = useActionState(createInvitation, undefined)
  const [copied, setCopied] = useState(false)

  return (
    <form action={action} className="space-y-4">
      <Field label="Email de la personne" hint="Elle devra créer son compte avec cet email.">
        <Input name="email" type="email" placeholder="assistant@gmail.com" required />
      </Field>
      <AccessFields roles={roles} markets={markets} />
      <SubmitButton pendingLabel="Création…">Créer l’invitation</SubmitButton>

      {state?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.link && (
        <div className="space-y-2 rounded-xl bg-emerald-50 p-3">
          <p className="text-sm text-emerald-800">{state.message}</p>
          <div className="flex gap-2">
            <Input readOnly value={state.link} className="text-xs" onFocus={(e) => e.currentTarget.select()} />
            <button
              type="button"
              className={buttonClass('secondary', 'shrink-0 px-3')}
              onClick={async () => {
                await navigator.clipboard.writeText(state.link!)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
            <a
              className={buttonClass('secondary', 'shrink-0 px-3')}
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`Rejoins l’équipe ${storeName} : ${state.link}`)}`}
              title="Envoyer par WhatsApp"
            >
              <MessageCircle className="size-4" />
            </a>
          </div>
          <p className="text-xs text-emerald-700">Lien valable 7 jours, utilisable une seule fois.</p>
        </div>
      )}
    </form>
  )
}
