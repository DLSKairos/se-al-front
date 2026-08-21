import { useEffect } from 'react'

const BRAND = 'SEÑAL'

/**
 * Actualiza `document.title` con el título de la página actual, siguiendo el
 * formato de marca "{título} · SEÑAL". Ayuda a que el usuario siempre pueda
 * responder "¿dónde estoy?" (wayfinding) al mirar la pestaña del navegador.
 *
 * Si `title` es undefined/vacío (ej. mientras carga un nombre dinámico), se
 * usa solo la marca como fallback para no dejar un título vacío o "en blanco".
 */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND}` : BRAND
  }, [title])
}
