'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

type MetaQueue = ((...args: any[]) => void) & { callMethod?: (...args: any[]) => void; queue?: any[]; loaded?: boolean; version?: string }

declare global {
  interface Window {
    fbq?: MetaQueue
    _fbq?: MetaQueue
    shopSaaSMetaTrack?: (eventName: string, data?: Record<string, any>, eventId?: string) => void
  }
}

function initializePixel(pixelId: string) {
  if (!window.fbq) {
    const fbq = function (...args: any[]) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args)
      else (fbq.queue ||= []).push(args)
    } as MetaQueue
    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    window.fbq = fbq
    window._fbq = fbq

    if (!document.querySelector('script[data-shopsaas-meta-pixel]')) {
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      script.dataset.shopsaasMetaPixel = 'true'
      document.head.appendChild(script)
    }
  }

  const initialized = (window as any).__shopSaaSInitializedPixels as Set<string> | undefined
    ?? new Set<string>()
  ;(window as any).__shopSaaSInitializedPixels = initialized
  if (!initialized.has(pixelId)) {
    window.fbq?.('init', pixelId)
    initialized.add(pixelId)
  }
}

export default function MetaPixelTracker({
  pixelId,
  productId,
  productName,
  value,
  currency,
}: {
  pixelId: string
  productId?: string
  productName?: string
  value?: number
  currency?: string
}) {
  const pathname = usePathname()

  useEffect(() => {
    if (!pixelId) return
    initializePixel(pixelId)
    const currentPath = pathname || window.location.pathname
    const pageKey = `${pixelId}:${currentPath}`
    const pageViews = ((window as any).__shopSaaSPageViews ||= new Set<string>()) as Set<string>
    if (!pageViews.has(pageKey)) {
      pageViews.add(pageKey)
      window.fbq?.('trackSingle', pixelId, 'PageView')
      if (productId) {
        window.fbq?.('trackSingle', pixelId, 'ViewContent', {
          content_type: 'product',
          content_ids: [productId],
          ...(productName ? { content_name: productName } : {}),
          ...(Number.isFinite(value) ? { value } : {}),
          ...(currency ? { currency } : {}),
        })
      }
    }

    window.shopSaaSMetaTrack = (eventName: string, data: Record<string, any> = {}, eventId?: string) => {
      if (!window.fbq) return
      if (eventId) window.fbq('trackSingle', pixelId, eventName, data, { eventID: eventId })
      else window.fbq('trackSingle', pixelId, eventName, data)
    }
    return () => { window.shopSaaSMetaTrack = undefined }
  }, [pixelId, productId, productName, value, currency, pathname])

  return null
}
