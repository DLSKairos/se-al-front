import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Estado de instalación de la PWA.
 *  - iOS: no hay prompt nativo; se muestran las instrucciones de Safari.
 *  - Android: se espera `beforeinstallprompt` (máx. 2 s). Si no llega y no estamos
 *    en modo standalone, la app ya está instalada en el dispositivo.
 */
export function usePWAInstall() {
  const ua = navigator.userAgent

  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ se identifica como Mac con pantalla táctil
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /android/i.test(ua)
  const isMobile = isIOS || isAndroid

  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [promptChecked, setPromptChecked] = useState(false)

  useEffect(() => {
    if (!isAndroid || isInstalled) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setPromptChecked(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    const timer = setTimeout(() => setPromptChecked(true), 2000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [isAndroid, isInstalled])

  function promptInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => setDeferredPrompt(null))
  }

  return {
    isMobile,
    isIOS,
    isAndroid,
    isInstalled,
    canInstall: isAndroid && deferredPrompt !== null,
    promptChecked,
    alreadyInstalledElsewhere: isAndroid && promptChecked && !deferredPrompt && !isInstalled,
    promptInstall,
  }
}
