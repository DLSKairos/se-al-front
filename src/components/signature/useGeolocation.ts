import { useState, useCallback } from 'react'

export interface GeolocationResult {
  lat: number
  lng: number
  accuracy: number
}

export type GeoStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error'

/**
 * Solicita la geolocalización del dispositivo con manejo explícito de
 * permisos denegados y errores de posición.
 *
 * Uso:
 *   const { position, status, error, request } = useGeolocation()
 *   // Llamar request() cuando se necesite la posición
 */
export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationResult | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setError('Tu dispositivo no admite geolocalización.')
      return
    }

    setStatus('loading')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setStatus('success')
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setStatus('denied')
          setError(
            'Permiso de ubicación denegado. Para registrar tu firma necesitamos saber desde dónde firmas. Activa la ubicación en la configuración de tu navegador e intenta de nuevo.',
          )
        } else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
          setStatus('error')
          setError('No pudimos obtener tu ubicación. Verifica que el GPS esté activo.')
        } else {
          setStatus('error')
          setError('Tiempo de espera agotado al obtener la ubicación. Intenta de nuevo.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 60_000,
      },
    )
  }, [])

  return { position, status, error, request }
}
