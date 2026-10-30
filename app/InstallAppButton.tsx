'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Download } from 'lucide-react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent
    const iosDevice = /iPhone|iPad|iPod/i.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    setIsIos(iosDevice && !('MSStream' in window))
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsInstalled(standalone)

    const handler = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isInstalled || (!installPrompt && !isIos)) return null

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome === 'accepted') toast.success('ShopSaaS est en cours d’installation.')
      setInstallPrompt(null)
      return
    }
    toast('Dans Safari : touche Partager, puis « Sur l’écran d’accueil ».', { duration: 6000 })
  }

  return (
    <button
      type="button"
      onClick={install}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100 sm:gap-1.5 sm:px-2.5"
      aria-label="Installer ShopSaaS sur ce téléphone"
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">Installer</span>
    </button>
  )
}
