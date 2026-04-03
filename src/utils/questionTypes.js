/**
 * questionTypes.js — configuración de timers por sección
 *
 * Las secciones listadas aquí reciben un TimerChallenge en QuestionWrapper.
 * Las secciones no listadas se muestran sin timer.
 */

export const TIMER_CONFIG = {
  // EPP — revisión rápida de equipos de protección personal (1.5 min)
  'epp': {
    duration:       90,
    bonusThreshold: 60,
  },

  // Sistema de restricción y protección contra caídas (2 min)
  'srpdc': {
    duration:       120,
    bonusThreshold: 90,
  },

  // Revisión pre-operacional de bomba y grúa (3 min)
  'revision': {
    duration:       180,
    bonusThreshold: 120,
  },

  // Sistemas operativos de la torregrúa (2.5 min)
  'sistemas': {
    duration:       150,
    bonusThreshold: 100,
  },
};

/**
 * Retorna la config de timer para una sección, o null si no tiene timer.
 * @param {string} sectionId
 * @returns {{ duration: number, bonusThreshold: number } | null}
 */
export function getTimerConfig(sectionId) {
  return TIMER_CONFIG[sectionId] ?? null;
}
