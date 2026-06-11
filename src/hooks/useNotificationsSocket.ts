import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { connectNotificationsSocket, NotificationSocketPayload } from '@/lib/socket'
import { QK } from '@/lib/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui'

/**
 * Conecta el socket de notificaciones en tiempo real mientras el usuario
 * esté autenticado. Al recibir el evento 'notification':
 *  - Invalida las queries de notificaciones (campanita se actualiza)
 *  - Muestra un toast informativo
 *
 * No acepta props — obtiene el token directamente del authStore.
 * Se desconecta al desmontar o al cerrar sesión.
 */
export function useNotificationsSocket() {
  const { token, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!isAuthenticated() || !token) return

    const socket = connectNotificationsSocket(token)
    socketRef.current = socket

    socket.on('notification', (payload: NotificationSocketPayload) => {
      // Invalidar todas las queries de notificaciones para refrescar el badge
      queryClient.invalidateQueries({ queryKey: QK.appNotifications.list() })

      // Toast informativo en la esquina inferior
      toast.success(payload.title ?? 'Nueva notificación')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  // Reconectar si cambia el token (nueva sesión)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return socketRef
}
