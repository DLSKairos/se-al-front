import { useState, useEffect } from 'react'

type EffectiveType = '2g' | 'slow-2g' | '3g' | '4g'

interface NetworkInformation extends EventTarget {
  effectiveType: EffectiveType
  addEventListener(type: 'change', listener: EventListener): void
  removeEventListener(type: 'change', listener: EventListener): void
}

function isSlowConnection(): boolean {
  const nav = navigator as Navigator & { connection?: NetworkInformation }
  if (!nav.connection) return false
  return nav.connection.effectiveType === 'slow-2g' || nav.connection.effectiveType === '2g'
}

/**
 * Devuelve true cuando la conexión es lenta (slow-2g o 2g según NetworkInformation API)
 * o cuando el dispositivo está offline.
 */
export function useSlowConnection(): boolean {
  const [slow, setSlow] = useState<boolean>(!navigator.onLine || isSlowConnection())

  useEffect(() => {
    const handleOnline = () => setSlow(isSlowConnection())
    const handleOffline = () => setSlow(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const nav = navigator as Navigator & { connection?: NetworkInformation }
    const handleChange = () => setSlow(!navigator.onLine || isSlowConnection())
    nav.connection?.addEventListener('change', handleChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      nav.connection?.removeEventListener('change', handleChange)
    }
  }, [])

  return slow
}
