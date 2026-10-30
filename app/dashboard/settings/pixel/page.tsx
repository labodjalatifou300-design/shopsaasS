import { requirePerm } from '@/lib/context'
import { Card, PageHeader, Field, Input } from '@/components/ui'
import { ActionForm, SubmitButton } from '@/components/form'
import { savePixelSettings } from './actions'

export default async function PixelPage() {
  const { supabase, store } = await requirePerm('settings.write')

  const { data: settings } = await supabase
    .from('store_settings')
    .select('fb_pixel_id, fb_access_token')
    .eq('store_id', store.id)
    .maybeSingle()

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Pixel & Tracking"
        subtitle="Connecte ton Pixel Meta pour suivre les commandes et optimiser tes pubs."
      />

      <Card>
        <ActionForm action={savePixelSettings} className="space-y-5">

          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Comment ça marche ?</p>
            <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
              <li>Le Pixel ID déclenche les événements navigateur (PageView, ViewContent…)</li>
              <li>Le Token d'accès envoie l'événement <strong>Purchase</strong> via l'API Conversions (côté serveur — plus fiable, ne dépend pas des bloqueurs de pubs)</li>
              <li>Les deux ensemble = déduplication automatique par Facebook</li>
            </ul>
          </div>

          <Field
            label="Pixel ID"
            hint="Trouvé dans Gestionnaire d'événements → Pixel → Paramètres"
          >
            <Input
              name="fb_pixel_id"
              defaultValue={settings?.fb_pixel_id ?? ''}
              placeholder="Ex: 1234567890123456"
            />
          </Field>

          <Field
            label="Token d'accès API Conversions"
            hint="Gestionnaire d'événements → Pixel → Paramètres → API Conversions → Générer un token"
          >
            <Input
              name="fb_access_token"
              defaultValue={settings?.fb_access_token ?? ''}
              placeholder="EAAGm..."
              type="password"
            />
          </Field>

          <SubmitButton>Enregistrer</SubmitButton>
        </ActionForm>
      </Card>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500 space-y-1">
        <p className="font-semibold text-zinc-700">Note importante : le Pixel ne fonctionne pas en local</p>
        <p>Facebook bloque tous les événements provenant de <code>localhost</code>. Pour tester, déploie sur Vercel ou utilise ngrok pour exposer ton serveur local.</p>
        <p>Tu peux vérifier que le code est bien chargé avec l'extension <strong>Meta Pixel Helper</strong> — elle affichera le Pixel ID même si les événements sont bloqués en local.</p>
      </div>
    </div>
  )
}
