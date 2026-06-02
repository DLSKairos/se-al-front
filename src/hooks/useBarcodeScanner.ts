import { useEffect, useRef } from 'react'

export function useBarcodeScanner(onScan: (codigo: string) => void, enabled = true) {
  const bufferRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      clearTimeout(timerRef.current)

      if (e.key === 'Enter') {
        if (bufferRef.current.length > 3) {
          onScanRef.current(bufferRef.current.trim())
        }
        bufferRef.current = ''
        return
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key
      }

      // La pistola envía todo en <50ms
      timerRef.current = setTimeout(() => {
        bufferRef.current = ''
      }, 50)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timerRef.current)
    }
  }, [enabled])
}
