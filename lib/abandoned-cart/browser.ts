export function getAbandonedCartSessionId(storeId: string, productId: string) {
  const key = `shopsaas-cart-session-${storeId}-${productId}`
  const existing = window.localStorage.getItem(key)
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing
  const created = window.crypto.randomUUID()
  window.localStorage.setItem(key, created)
  return created
}

export async function saveAbandonedCart(input: {
  storeId: string
  productId: string
  variantId: string
  marketId: string
  sessionId: string
  name: string
  phone: string
  email?: string
  city?: string
  quantity: number
}, apiBase = '') {
  if (input.name.trim().length < 2 || input.phone.trim().length < 6) return
  try {
    const response = await fetch(`${apiBase}/api/abandoned-carts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', ...input, website: '' }),
      keepalive: true,
    })
    if (!response.ok) console.warn('[abandoned-carts] unable to save a draft')
  } catch {
    // Saving a follow-up draft must never block a real order or its confirmation.
  }
}

export async function markAbandonedCartConverted(input: {
  storeId: string
  productId: string
  sessionId: string
  orderId: string
}, apiBase = '') {
  await fetch(`${apiBase}/api/abandoned-carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'convert', ...input }),
    keepalive: true,
  })
}
