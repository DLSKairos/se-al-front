const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
const dtf = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })

const MINUTE = 60
const HOUR = 3600
const DAY = 86400
const TWO_DAYS = 172800

/**
 * Tiempo relativo en español.
 * Ejemplos: "hace un momento", "hace 5 minutos", "hace 2 horas", "ayer", "3 jun"
 */
export function relativeTime(date: string | Date): string {
  const then = date instanceof Date ? date : new Date(date)
  const diff = Math.floor((Date.now() - then.getTime()) / 1000) // segundos

  if (diff < MINUTE) return 'hace un momento'
  if (diff < HOUR) return rtf.format(-Math.floor(diff / MINUTE), 'minute')
  if (diff < DAY) return rtf.format(-Math.floor(diff / HOUR), 'hour')
  if (diff < TWO_DAYS) return rtf.format(-1, 'day')

  return dtf.format(then)
}
