import { useRef, useCallback, useEffect } from 'react'
import type { ReadingLogEntry } from '@/types'

interface TrackerSection {
  id: string
}

/**
 * Acumula segundos de lectura por sección/pregunta.
 * Pausa automáticamente cuando la pestaña pierde el foco.
 *
 * Uso:
 *   const { startSection, stopSection, getLog } = useReadingTracker()
 *
 *   // Cuando el usuario cambia a una sección:
 *   startSection(section.id)
 *
 *   // Al finalizar:
 *   const log = getLog()  // ReadingLogEntry[]
 */
export function useReadingTracker() {
  // Mapa de id -> segundos acumulados
  const accumulatedRef = useRef<Map<string, number>>(new Map())
  // Sección actualmente activa
  const activeSectionRef = useRef<string | null>(null)
  // Timestamp de cuándo empezó la sección activa (o de cuándo se reanudó la pestaña)
  const startTimeRef = useRef<number | null>(null)
  // Si la pestaña está visible
  const isVisibleRef = useRef<boolean>(!document.hidden)

  // ── Flush: acumula el tiempo transcurrido de la sección activa ────────────
  const flush = useCallback(() => {
    const activeId = activeSectionRef.current
    const start = startTimeRef.current
    if (!activeId || start === null) return

    const elapsed = Math.floor((Date.now() - start) / 1000)
    if (elapsed > 0) {
      const prev = accumulatedRef.current.get(activeId) ?? 0
      accumulatedRef.current.set(activeId, prev + elapsed)
    }
    startTimeRef.current = Date.now()
  }, [])

  // ── Visibilidad de la pestaña ─────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pestaña oculta: acumular lo que había y pausar
        flush()
        startTimeRef.current = null
        isVisibleRef.current = false
      } else {
        // Pestaña visible de nuevo: reanudar desde ahora
        isVisibleRef.current = true
        if (activeSectionRef.current !== null) {
          startTimeRef.current = Date.now()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flush])

  // ── startSection: registrar inicio de una sección ─────────────────────────
  const startSection = useCallback(
    (section: TrackerSection | string) => {
      const id = typeof section === 'string' ? section : section.id

      // Flush la sección anterior si la hay
      flush()

      activeSectionRef.current = id
      startTimeRef.current = isVisibleRef.current ? Date.now() : null
    },
    [flush],
  )

  // ── stopSection: detener tracking de la sección actual ───────────────────
  const stopSection = useCallback(() => {
    flush()
    activeSectionRef.current = null
    startTimeRef.current = null
  }, [flush])

  // ── getLog: producir el array de ReadingLogEntry ──────────────────────────
  const getLog = useCallback((): ReadingLogEntry[] => {
    // Flush por si queda tiempo no contabilizado
    flush()
    const entries: ReadingLogEntry[] = []
    accumulatedRef.current.forEach((seconds, id) => {
      entries.push({ section_or_field_id: id, seconds_viewed: seconds })
    })
    return entries
  }, [flush])

  // ── getSecondsForSection: para mostrar el contador en UI ─────────────────
  const getSecondsForSection = useCallback(
    (sectionId: string): number => {
      const accumulated = accumulatedRef.current.get(sectionId) ?? 0
      if (
        activeSectionRef.current === sectionId &&
        startTimeRef.current !== null &&
        isVisibleRef.current
      ) {
        return accumulated + Math.floor((Date.now() - startTimeRef.current) / 1000)
      }
      return accumulated
    },
    [],
  )

  return { startSection, stopSection, getLog, getSecondsForSection }
}
