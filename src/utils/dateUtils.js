/**
 * Convierte un valor de fecha a formato YYYY-MM-DD.
 * Si ya es un string en ese formato, lo retorna sin cambios.
 * Usa la zona horaria de Colombia (America/Bogota) para evitar
 * desfase de un día en fechas UTC.
 *
 * @param {Date|string|null|undefined} date
 * @returns {string}
 */
export function toYMD(date) {
  if (!date) return "";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return new Date(date).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

/**
 * Retorna la clave de semana actual en formato "YYYY-WN".
 * Usa la misma lógica que los formularios existentes (firstJan + getDay())
 * para garantizar que las claves de localStorage sean idénticas tanto en
 * modo formulario como en modo gamificado.
 *
 * @returns {string} ej: "2026-W10"
 */
export function getCurrentWeekKey() {
  const now = new Date();
  const firstJan = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - firstJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + firstJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

/**
 * Retorna true si hoy es domingo (momento de limpiar datos semanales).
 *
 * @returns {boolean}
 */
export function isSunday() {
  return new Date().getDay() === 0;
}

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD usando la zona horaria
 * de Colombia (America/Bogota, UTC-5). Equivalente a lo que los formularios
 * hacen con new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" }).
 *
 * @returns {string} ej: "2026-03-10"
 */
export function todayStrBogota() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}
