'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react'

type MetaSettings = {
  pixelId: string
  capiConnected: boolean
}

export default function MetaPixelSettings({ storeId }: { storeId: string }) {
  const [settings, setSettings] = useState<MetaSettings>({
    pixelId: '',
    capiConnected: false,
  })
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void fetch(`/api/integrations/meta?storeId=${encodeURIComponent(storeId)}`, { cache: 'no-store' })
      .then(async response => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Impossible de charger Meta.')
        if (active) setSettings({
          pixelId: result.pixelId || '',
          capiConnected: result.capiConnected === true,
        })
      })
      .catch(err => { if (active) setError(err.message || 'Impossible de charger Meta.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [storeId])

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/integrations/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          pixelId: settings.pixelId,
          accessToken,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Enregistrement impossible.')
      setAccessToken('')
      setSettings(current => ({ ...current, capiConnected: settings.pixelId.trim() !== '' }))
      setMessage(settings.pixelId.trim() ? 'Réglages enregistrés. Le token reste privé.' : 'Intégration Meta supprimée.')
    } catch (err: any) {
      setError(err?.message || 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm text-gray-500"><Loader2 className="size-4 animate-spin" />Chargement des réglages Meta…</div>
  }

  return (
    <form onSubmit={saveSettings} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3">
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="meta-pixel-id">Pixel ID</label>
        <input
          id="meta-pixel-id"
          inputMode="numeric"
          autoComplete="off"
          value={settings.pixelId}
          onChange={event => setSettings(current => ({ ...current, pixelId: event.target.value.replace(/\D/g, '') }))}
          placeholder="Ex. 123456789012345"
          className="min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="meta-capi-token">Token Conversions API</label>
        <input
          id="meta-capi-token"
          type="password"
          autoComplete="new-password"
          value={accessToken}
          onChange={event => setAccessToken(event.target.value)}
          placeholder={settings.capiConnected ? 'Déjà enregistré. Laisse vide pour le garder.' : 'Colle le token généré par Meta'}
          className="min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Le token est chiffré dans Supabase. Il n’est jamais ajouté au code public de la boutique.
          {settings.capiConnected && <span className="ml-1 font-semibold text-emerald-700">Token enregistré</span>}
        </p>
      </div>

      {error && <p role="alert" className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</p>}
      {message && <p role="status" className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{message}</p>}

      <button type="submit" disabled={saving} className="min-h-11 w-full rounded-xl bg-blue-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60">
        {saving ? 'Enregistrement…' : 'Connecter Meta'}
      </button>
      <p className="text-xs leading-5 text-gray-500">
        Le Pixel se charge sur la boutique publique. Purchase part après l’enregistrement réussi de la commande, au navigateur et au serveur.
      </p>
    </form>
  )
}
