import { useEffect, useState } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const LITE_MODE_KEY = 'lite_mode'

function computeReducedMotion(): boolean {
  const liteMode = sessionStorage.getItem(LITE_MODE_KEY) === 'true'
  const systemPrefersReduced =
    typeof window !== 'undefined' && !!window.matchMedia?.(REDUCED_MOTION_QUERY).matches
  return liteMode || systemPrefersReduced
}

/**
 * true si el usuario activó el modo lite (sessionStorage `lite_mode`, la misma
 * bandera que usan LoginPage/OperatorLayout/OperatorHomePage) o si el sistema
 * operativo tiene "reducir movimiento" activado. Los componentes decorativos
 * (animaciones infinitas, confetti, transiciones largas) deben consultar este
 * hook y renderizar una alternativa estática cuando devuelve true.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(computeReducedMotion)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const recompute = () => setReduced(computeReducedMotion())

    mediaQuery.addEventListener('change', recompute)
    window.addEventListener('storage', recompute)

    return () => {
      mediaQuery.removeEventListener('change', recompute)
      window.removeEventListener('storage', recompute)
    }
  }, [])

  return reduced
}
