import api from '@/lib/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

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
  } catch {
    // La suscripción push no es crítica; errores silenciados intencionalmente.
  }
}
