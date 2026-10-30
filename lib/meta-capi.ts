/**
 * Meta Conversions API — envoi côté serveur (Server-Side Events).
 * Utilisé pour l'événement Purchase à chaque commande confirmée.
 * Fonctionne même si le client bloque le Pixel navigateur.
 */

interface CapiPurchaseParams {
  pixelId: string
  accessToken: string
  orderId: string
  value: number
  currency: string
  customerPhone?: string | null
  customerEmail?: string | null
  sourceUrl?: string
}

export async function sendCapiPurchase(params: CapiPurchaseParams): Promise<void> {
  const {
    pixelId, accessToken, orderId,
    value, currency, customerPhone,
    customerEmail, sourceUrl,
  } = params

  if (!pixelId || !accessToken) return

  // Hacher le numéro de téléphone (requis par Meta)
  const hashPhone = customerPhone
    ? await sha256(customerPhone.replace(/\D/g, ''))
    : undefined

  const hashEmail = customerEmail
    ? await sha256(customerEmail.toLowerCase().trim())
    : undefined

  const eventTime = Math.floor(Date.now() / 1000)

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: eventTime,
        event_id: `order-${orderId}`, // déduplication avec le pixel navigateur
        event_source_url: sourceUrl,
        action_source: 'website',
        user_data: {
          ...(hashPhone ? { ph: [hashPhone] } : {}),
          ...(hashEmail ? { em: [hashEmail] } : {}),
        },
        custom_data: {
          value,
          currency: currency.toUpperCase(),
          order_id: orderId,
        },
      },
    ],
    // test_event_code: 'TEST12345', // Décommenter pour tester dans l'outil de test Meta
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const result = await res.json()
    if (!res.ok) {
      console.error('[CAPI] Purchase event failed:', result)
    } else {
      console.log('[CAPI] Purchase sent:', result.events_received, 'event(s) received')
    }
  } catch (err) {
    console.error('[CAPI] Network error:', err)
  }
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
