import api from '@/lib/api'
import { urlBase64ToUint8Array } from '@/lib/vapid'

export async function subscribeUser(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
    if (!vapidKey) throw new Error('VITE_VAPID_PUBLIC_KEY no definido')

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
    })

    await api.post('/push/subscribe', {
      subscription: subscription.toJSON(),
    })
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[pushNotifications] Error al suscribir:', err)
    }
  }
}
