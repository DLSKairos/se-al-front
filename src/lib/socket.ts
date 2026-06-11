import { io, Socket } from 'socket.io-client'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * URL base del servidor (sin el sufijo '/api').
 * El gateway de WebSocket escucha en el namespace /notifications del servidor raíz.
 */
const SERVER_BASE = BASE_URL.replace(/\/api\/?$/, '')

/**
 * Payload del evento 'notification' que emite el gateway de Socket.IO.
 * El backend publica: { notificationId, type, title }
 * (ver NotificationsGateway.handleRedisMessage).
 */
export interface NotificationSocketPayload {
  notificationId: string
  type: string
  title: string
}

/**
 * Conecta al gateway de notificaciones en tiempo real.
 *
 * Namespace: /notifications
 * Auth: { token: JWT }  — el gateway valida el JWT en el handshake.
 * Evento entrante: 'notification' con payload NotificationSocketPayload.
 *
 * @param token  JWT del usuario autenticado (obtenido del authStore)
 * @returns  Socket conectado. Llamar .disconnect() al desmontar.
 *
 * @example
 * ```ts
 * const socket = connectNotificationsSocket(token)
 * socket.on('notification', (payload) => { ... })
 * return () => socket.disconnect()
 * ```
 */
export function connectNotificationsSocket(token: string): Socket {
  return io(`${SERVER_BASE}/notifications`, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    // Transports: polling primero para compatibilidad con proxies, luego upgrade a WS
    transports: ['polling', 'websocket'],
  })
}
