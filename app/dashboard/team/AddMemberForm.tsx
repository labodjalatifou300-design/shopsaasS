'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react'
import { Field, Input, Select, buttonClass } from '@/components/ui'
import { addMemberDirect } from './actions'

interface Role { id: string; name: string }

export function AddMemberForm({ roles }: { roles: Role[] }) {
  const [state, action, pending] = useActionState(addMemberDirect, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState(() => generatePassword())
  const [copied, setCopied] = useState(false)

  function generatePassword() {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#'
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  async function copyCredentials() {
    if (!state?.credentials) return
    const text = `Email : ${state.credentials.email}\nMot de passe : ${state.credentials.password}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form action={action} className="space-y-4">

      <Field label="Nom complet (optionnel)">
        <Input name="full_name" type="text" placeholder="Ex: Amadou Diallo" />
      </Field>

      <Field label="Email *">
        <Input name="email" type="email" placeholder="assistant@gmail.com" required />
      </Field>

      <Field label="Mot de passe *">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            className="shrink-0 rounded-xl border border-zinc-200 px-3 hover:bg-zinc-50 transition-colors"
            title="Générer un mot de passe"
          >
            <RefreshCw className="size-4 text-zinc-500" />
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-1">Génère-en un ou saisis-en un. Note-le avant de l'envoyer.</p>
      </Field>

      <Field label="Rôle *">
        <Select name="role_id" required>
          <option value="">Choisir un rôle…</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
      </Field>

      <button
        type="submit"
        disabled={pending}
        className={buttonClass('primary', 'w-full')}
      >
        {pending ? 'Création en cours…' : 'Créer le compte et ajouter'}
      </button>

      {/* Erreur */}
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 border border-red-100">
          {state.error}
        </p>
      )}

      {/* Succès — afficher les identifiants */}
      {state?.credentials && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-800">{state.message}</p>
          <div className="rounded-lg bg-white border border-emerald-100 p-3 space-y-1.5 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Email</span>
              <span className="font-semibold text-zinc-800">{state.credentials.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Mot de passe</span>
              <span className="font-semibold text-zinc-800">{state.credentials.password}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={copyCredentials}
            className={buttonClass('secondary', 'w-full gap-2')}
          >
            {copied ? <><Check className="size-4" /> Copié !</> : <><Copy className="size-4" /> Copier les identifiants</>}
          </button>
          <p className="text-xs text-emerald-700">
            Envoie ces identifiants à {state.credentials.email}. La personne peut se connecter directement sur la page de connexion.
          </p>
        </div>
      )}
    </form>
  )
}
