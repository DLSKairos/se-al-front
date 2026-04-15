/**
 * gameConfig.ts — Constantes de configuración del sistema de juego.
 * Los worlds/templates se cargan dinámicamente desde la API.
 */

export const GAME_CONFIG = {
  SESSION_HOURS:            16,   // Duración de sesión de juego
  GPS_THRESHOLD_METERS:     500,  // Radio máximo desde la obra
  CELEBRATION_DURATION_MS:  800,  // Duración de la micro-celebración
  TRANSITION_DURATION_MS:   1800, // Duración de la transición entre niveles
} as const
