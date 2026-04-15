/**
 * gameProgress.ts — Sistema de progreso por localStorage
 *
 * Sesión de 16 horas:
 *   - La sesión arranca cuando se completa el primer registro del día
 *     (hora-ingreso siempre es el primero).
 *   - El progreso se conserva aunque la app se cierre y se reabra,
 *     siempre que hayan pasado menos de 16 horas desde ese primer registro.
 *   - Pasadas las 16 horas la sesión expira y se crea una nueva al
 *     completar el siguiente hora-ingreso.
 *
 * Clave: game_session_{cedula}_{obra_id}
 * Valor: { startedAt: <timestamp ms>, completed: [worldId, ...] }
 */

const SESSION_DURATION_MS = 16 * 60 * 60 * 1000 // 16 horas

interface GameSession {
  startedAt: number
  completed: string[]
}

/** Construye la clave de sesión para un par cedula+obraId */
function getSessionKey(cedula: string, obraId: string): string {
  return `game_session_${cedula}_${obraId}`
}

/**
 * Lee la sesión activa para el par cedula+obraId.
 * Devuelve null si no existe o si ya expiró (≥ 16 h desde startedAt).
 */
function getSession(cedula: string, obraId: string): GameSession | null {
  try {
    const raw = localStorage.getItem(getSessionKey(cedula, obraId))
    if (!raw) return null

    const session = JSON.parse(raw) as GameSession
    if (!session?.startedAt) return null

    if (Date.now() - session.startedAt >= SESSION_DURATION_MS) {
      localStorage.removeItem(getSessionKey(cedula, obraId))
      return null
    }

    return session
  } catch {
    return null
  }
}

/**
 * Devuelve array de templateIds completados en la sesión activa.
 */
export function getCompletedWorlds(cedula: string, obraId: string): string[] {
  return getSession(cedula, obraId)?.completed ?? []
}

/**
 * Marca un mundo como completado.
 * Si no existe sesión activa, crea una nueva con startedAt = ahora.
 * Idempotente: no duplica si ya estaba marcado.
 */
export function markWorldComplete(cedula: string, obraId: string, worldId: string): void {
  try {
    const session = getSession(cedula, obraId) ?? { startedAt: Date.now(), completed: [] }

    if (!session.completed.includes(worldId)) {
      session.completed.push(worldId)
      localStorage.setItem(getSessionKey(cedula, obraId), JSON.stringify(session))
    }
  } catch {
    // Cuota de localStorage excedida — se ignora silenciosamente
  }
}

/**
 * Comprueba si un mundo ya fue completado en la sesión activa.
 */
export function isWorldComplete(cedula: string, obraId: string, worldId: string): boolean {
  return getCompletedWorlds(cedula, obraId).includes(worldId)
}

/**
 * Calcula el estado de un mundo dado el cedula, obraId y el worldId.
 * Lógica simplificada: complete | current | locked
 * (sin dependencia de gameConfig estático — los mundos vienen de la API)
 */
export function computeWorldStatus(
  worldId: string,
  cedula: string,
  obraId: string,
): 'complete' | 'current' | 'locked' {
  const completed = getCompletedWorlds(cedula, obraId)
  if (completed.includes(worldId)) return 'complete'
  return 'current'
}

/**
 * Devuelve cuántos minutos quedan en la sesión activa, o null si no hay sesión.
 */
export function getSessionMinutesLeft(cedula: string, obraId: string): number | null {
  const session = getSession(cedula, obraId)
  if (!session) return null
  const elapsed = Date.now() - session.startedAt
  return Math.max(0, Math.round((SESSION_DURATION_MS - elapsed) / 60_000))
}
