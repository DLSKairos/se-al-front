/**
 * gameProgress.js — Sistema de progreso por localStorage
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

const SESSION_DURATION_MS = 16 * 60 * 60 * 1000; // 16 horas

/** Construye la clave de sesión (sin fecha — la ventana la gestiona startedAt) */
function getSessionKey() {
  const cedula = localStorage.getItem('cedula_trabajador') || 'anon';
  const obraId = localStorage.getItem('obra_id')           || '0';
  return `game_session_${cedula}_${obraId}`;
}

/**
 * Lee la sesión activa.
 * Devuelve null si no existe o si ya expiró (≥ 16 h desde startedAt).
 * @returns {{ startedAt: number, completed: string[] } | null}
 */
function getSession() {
  try {
    const raw = localStorage.getItem(getSessionKey());
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session?.startedAt) return null;

    if (Date.now() - session.startedAt >= SESSION_DURATION_MS) {
      // Sesión expirada — se elimina del almacenamiento
      localStorage.removeItem(getSessionKey());
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Devuelve array de worldIds completados en la sesión activa.
 * @returns {string[]}
 */
export function getCompletedWorlds() {
  return getSession()?.completed ?? [];
}

/**
 * Marca un mundo como completado.
 * Si no existe sesión activa, crea una nueva con startedAt = ahora.
 * Idempotente: no duplica si ya estaba marcado.
 * @param {string} worldId
 */
export function markWorldComplete(worldId) {
  try {
    // Recuperar sesión vigente o crear nueva
    const session = getSession() ?? { startedAt: Date.now(), completed: [] };

    if (!session.completed.includes(worldId)) {
      session.completed.push(worldId);
      localStorage.setItem(getSessionKey(), JSON.stringify(session));
    }
  } catch {
    // Cuota de localStorage excedida — se ignora silenciosamente
  }
}

/**
 * Comprueba si un mundo ya fue completado en la sesión activa.
 * @param {string} worldId
 * @returns {boolean}
 */
export function isWorldComplete(worldId) {
  return getCompletedWorlds().includes(worldId);
}

/**
 * Devuelve cuántos minutos quedan en la sesión activa, o null si no hay sesión.
 * Útil para mostrar al usuario cuánto tiempo tiene para completar el resto.
 * @returns {number|null}
 */
export function getSessionMinutesLeft() {
  const session = getSession();
  if (!session) return null;
  const elapsed = Date.now() - session.startedAt;
  return Math.max(0, Math.round((SESSION_DURATION_MS - elapsed) / 60_000));
}

/**
 * Calcula el estado de un mundo dado el array de completados y
 * la lista completa de mundos (ordenados por world.order).
 *
 * Lógica de desbloqueo secuencial:
 *   - completed  → ya fue completado en la sesión activa
 *   - pending    → es el primer mundo sin completar (desbloqueado)
 *   - locked     → aún no llegó su turno
 *   - optional   → world.daily === false y no completado
 *
 * @param {object}   world          — entrada de gameConfig
 * @param {string[]} completedIds   — de getCompletedWorlds()
 * @param {object[]} allWorlds      — todos los mundos del personaje
 * @returns {'completed'|'pending'|'locked'|'optional'}
 */
export function computeWorldStatus(world, completedIds, allWorlds) {
  if (completedIds.includes(world.id)) return 'completed';

  // Mundos no diarios → siempre opcionales (desbloqueados pero no bloquean el flujo)
  if (world.daily === false) return 'optional';

  // Primer mundo diario sin completar → pendiente (desbloqueado)
  const firstPending = allWorlds
    .filter(w => w.daily !== false && !completedIds.includes(w.id))
    .sort((a, b) => a.order - b.order)[0];

  if (world.id === firstPending?.id) return 'pending';

  return 'locked';
}
