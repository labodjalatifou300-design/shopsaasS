// Kept under its existing name so the order forms stay small. Storefront
// tracking is initialized automatically from the store's Pixel settings.
export function hasMetaTrackingConsent(_storeId: string) {
  return true
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const prefix = `${name}=`
  const value = document.cookie.split('; ').find(item => item.startsWith(prefix))?.slice(prefix.length)
  return value ? decodeURIComponent(value) : null
}

export function getMetaBrowserContext() {
  return {
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc'),
  }
}

export function trackMetaBrowserEvent(
  eventName: string,
  data: Record<string, unknown>,
  eventId?: string,
) {
  if (typeof window === 'undefined' || !window.shopSaaSMetaTrack) return
  window.shopSaaSMetaTrack(eventName, data, eventId)
}

declare global {
  interface Window {
    shopSaaSMetaTrack?: (eventName: string, data?: Record<string, any>, eventId?: string) => void
  }
}
