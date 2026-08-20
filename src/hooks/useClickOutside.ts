import { useEffect, RefObject } from 'react'

/**
 * Cierra/ejecuta `onOutside` cuando se detecta un click (mousedown) fuera
 * del elemento referenciado por `ref`.
 *
 * @param ref - Elemento que delimita el área "adentro"
 * @param onOutside - Callback ejecutado en click afuera
 * @param active - Si es false, no se agrega el listener (por defecto true)
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside, active])
}
