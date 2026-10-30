'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.error('[pwa] Service worker registration failed:', error)
    })
  }, [])

  return null
}
