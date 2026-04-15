import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { haversineDistance } from '@/lib/utils'
import { QK } from '@/lib/queryKeys'
import { WorkLocation } from '@/types'
import { Button, LoadingSpinner, ErrorMessage } from '@/components/ui'

// ── Constantes ────────────────────────────────────────────────────────────────

const GPS_THRESHOLD_METERS = 500

// ── Tipos locales ─────────────────────────────────────────────────────────────

type GpsState = 'idle' | 'loading' | 'ok' | 'error'

// ── Componente ────────────────────────────────────────────────────────────────

export default function LocationSelectPage() {
  const navigate = useNavigate()
  const { setWorkLocation, user } = useAuthStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [gpsState, setGpsState] = useState<GpsState>('idle')
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [distance, setDistance] = useState<number | null>(null)

  const {
    data: locations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QK.workLocations(),
    queryFn: () => api.get<WorkLocation[]>('/work-locations').then((r) => r.data),
  })

  const selectedLocation = locations.find((l) => l.id === selectedId)

  const handleSelectLocation = (id: string) => {
    setSelectedId(id)
    setGpsState('idle')
    setGpsError(null)
    setDistance(null)
  }

  const handleConfirm = () => {
    if (!selectedLocation) return
    setGpsState('loading')
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const dist = haversineDistance(
          latitude,
          longitude,
          Number(selectedLocation.lat),
          Number(selectedLocation.lng),
        )
        const rounded = Math.round(dist)
        setDistance(rounded)

        if (dist > GPS_THRESHOLD_METERS) {
          setGpsState('error')
          setGpsError(
            `Estás a ${rounded}m de la obra. El límite es ${GPS_THRESHOLD_METERS}m.`,
          )
        } else {
          setGpsState('ok')
          setWorkLocation(selectedId!)
          setTimeout(() => {
            if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') navigate('/admin')
            else navigate('/')
          }, 800)
        }
      },
      () => {
        setGpsState('error')
        setGpsError(
          'No se pudo acceder a tu ubicación. Habilita el GPS e intenta de nuevo.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // ── Estados de carga / error de la query ──────────────────────────────────

  if (isLoading) {
    return <LoadingSpinner fullscreen label="Cargando ubicaciones..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--navy)] flex items-center justify-center">
        <ErrorMessage message="Error al cargar las ubicaciones" />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-[var(--navy)] flex flex-col overflow-auto"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-1">
          Ubicación
        </div>
        <h1 className="font-display font-extrabold text-2xl text-[var(--off-white)]">
          Selecciona tu obra
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1 font-dm">
          Elige la obra en la que trabajarás hoy
        </p>
      </div>

      {/* Lista de ubicaciones */}
      <div className="flex-1 px-6 pb-36 flex flex-col gap-3">
        {locations.length === 0 ? (
          <p className="text-center text-[var(--muted)] text-sm font-dm py-8">
            No hay ubicaciones activas disponibles.
          </p>
        ) : (
          <div
            role="listbox"
            aria-label="Selecciona una obra"
            className="flex flex-col gap-3"
          >
            {locations.map((loc) => {
              const isSelected = selectedId === loc.id
              return (
                <button
                  key={loc.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLocation(loc.id)}
                  className={`glass p-5 text-left rounded-[20px] transition-all duration-200 active:scale-[0.98] ${
                    isSelected ? 'border-t-2 border-t-[var(--signal)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold tracking-[0.1em] uppercase px-2.5 py-0.5 rounded inline-block mb-1.5 bg-[var(--signal-dim)] text-[var(--signal)] border border-[rgba(0,212,255,0.25)]">
                        {isSelected ? 'Seleccionada' : 'Disponible'}
                      </div>
                      <p className="font-display font-bold text-base text-[var(--off-white)] truncate">
                        {loc.name}
                      </p>
                      <p className="text-xs text-[var(--muted)] font-dm truncate mt-0.5">
                        {loc.contractor}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-[var(--signal)] rounded-full grid place-items-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-[var(--navy)]" />
                      </div>
                    )}
                    {!isSelected && (
                      <MapPin className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Mensaje de error GPS */}
        {gpsState === 'error' && gpsError && (
          <div
            role="alert"
            className="flex items-start gap-2 p-3 rounded-[14px] bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-300 font-dm">{gpsError}</p>
          </div>
        )}

        {/* Confirmación GPS OK */}
        {gpsState === 'ok' && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-[14px] bg-emerald-500/10 border border-emerald-500/20"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <p className="text-sm text-emerald-300 font-dm">
              Ubicación verificada ({distance}m de la obra)
            </p>
          </div>
        )}
      </div>

      {/* Botón confirmar fijo */}
      <div
        className="fixed bottom-0 left-0 right-0 p-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
      >
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedId || gpsState === 'loading' || gpsState === 'ok'}
          className="btn-primary-gradient w-full py-4 rounded-[14px] disabled:opacity-50"
        >
          {gpsState === 'loading' ? (
            <span className="inline-flex items-center gap-2 justify-center">
              <span
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin inline-block"
                style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }}
              />
              Verificando ubicación...
            </span>
          ) : (
            'Confirmar y entrar'
          )}
        </button>
      </div>
    </div>
  )
}
