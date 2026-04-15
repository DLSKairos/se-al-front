import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bell, BellOff, Info, Send, Smartphone } from 'lucide-react'
import api from '@/lib/api'
import { Button, useToast } from '@/components/ui'

type SubscriptionStatus = 'unknown' | 'unsupported' | 'denied' | 'subscribed' | 'not-subscribed'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const bytes = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

export default function PushTestPage() {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('unknown')
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  async function checkSubscriptionStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSubscriptionStatus('unsupported')
      return
    }
    const permission = Notification.permission
    if (permission === 'denied') {
      setSubscriptionStatus('denied')
      return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      setSubscriptionStatus(existing ? 'subscribed' : 'not-subscribed')
    } catch {
      setSubscriptionStatus('not-subscribed')
    }
  }

  const testMutation = useMutation({
    mutationFn: (data: { title: string; body: string }) =>
      api.post('/push/test', data).then((r) => r.data),
    onSuccess: () => toast.success('Notificación de prueba enviada correctamente'),
    onError: () => toast.error('Error al enviar la notificación de prueba'),
  })

  const subscribeMutation = useMutation({
    mutationFn: (subscription: PushSubscription) =>
      api.post('/push/subscribe', { subscription }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Dispositivo suscrito a notificaciones push')
      setSubscriptionStatus('subscribed')
    },
    onError: () => toast.error('Error al suscribir el dispositivo'),
  })

  async function handleSubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setIsSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.warning('Permiso de notificaciones denegado')
        setSubscriptionStatus('denied')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        ...(VAPID_PUBLIC_KEY
          ? { applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY) }
          : {}),
      }
      const subscription = await reg.pushManager.subscribe(subscribeOptions)
      subscribeMutation.mutate(subscription)
    } catch (err) {
      toast.error('Error al solicitar permiso de notificaciones')
    } finally {
      setIsSubscribing(false)
    }
  }

  function handleTestSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('El título es obligatorio')
      return
    }
    testMutation.mutate({ title: title.trim(), body: body.trim() })
  }

  const statusConfig: Record<
    SubscriptionStatus,
    { label: string; color: string; icon: React.ElementType }
  > = {
    unknown: { label: 'Verificando...', color: 'text-[var(--muted)]', icon: Bell },
    unsupported: { label: 'No soportado en este navegador', color: 'text-red-400', icon: BellOff },
    denied: { label: 'Permiso denegado por el usuario', color: 'text-red-400', icon: BellOff },
    subscribed: { label: 'Este dispositivo está suscrito', color: 'text-emerald-400', icon: Bell },
    'not-subscribed': { label: 'No suscrito', color: 'text-amber-400', icon: BellOff },
  }

  const status = statusConfig[subscriptionStatus]
  const StatusIcon = status.icon

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
          Notificaciones Push
        </h1>
        <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
          Prueba y gestiona las notificaciones push del sistema
        </p>
      </div>

      {/* Info */}
      <div className="glass-card p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--signal)] shrink-0" />
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base">
            ¿Qué son las notificaciones push?
          </h2>
        </div>
        <div className="flex flex-col gap-2 text-sm text-[var(--muted)] font-['DM_Sans'] leading-relaxed">
          <p>
            Las notificaciones push permiten que SEÑAL envíe alertas a los dispositivos de los
            usuarios incluso cuando la aplicación no está abierta.
          </p>
          <p>
            Se usan para notificar eventos importantes: nuevos formularios asignados, aprobaciones,
            rechazos y recordatorios programados.
          </p>
          <p>
            Cada dispositivo debe suscribirse individualmente. El navegador solicita permiso al
            usuario antes de activar las notificaciones.
          </p>
        </div>
      </div>

      {/* Estado de suscripción */}
      <div className="glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[var(--signal)] shrink-0" />
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base">
            Estado de este dispositivo
          </h2>
        </div>
        <div className={`flex items-center gap-2 text-sm font-['DM_Sans'] font-medium ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          {status.label}
        </div>
        {subscriptionStatus === 'not-subscribed' && (
          <Button
            onClick={handleSubscribe}
            loading={isSubscribing || subscribeMutation.isPending}
            className="w-fit"
          >
            <Bell className="w-4 h-4" />
            Suscribir este dispositivo
          </Button>
        )}
        {subscriptionStatus === 'denied' && (
          <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
            Para habilitar las notificaciones, ve a la configuración de tu navegador y concede
            el permiso para este sitio.
          </p>
        )}
        {subscriptionStatus === 'unsupported' && (
          <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
            Tu navegador actual no soporta notificaciones push. Prueba con Chrome, Edge o Firefox
            en un dispositivo de escritorio o Android.
          </p>
        )}
      </div>

      {/* Formulario de prueba */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-4 h-4 text-[var(--signal)] shrink-0" />
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base">
            Enviar notificación de prueba
          </h2>
        </div>
        <form onSubmit={handleTestSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="push-title"
              className="text-sm text-[var(--muted)] font-['DM_Sans']"
            >
              Título <span className="text-red-400">*</span>
            </label>
            <input
              id="push-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Alerta de sistema"
              required
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="push-body"
              className="text-sm text-[var(--muted)] font-['DM_Sans']"
            >
              Cuerpo del mensaje
            </label>
            <textarea
              id="push-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Texto descriptivo de la notificación..."
              rows={3}
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all resize-none"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={testMutation.isPending}>
              <Send className="w-4 h-4" />
              Enviar notificación de prueba
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
