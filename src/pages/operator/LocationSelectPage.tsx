import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { haversineDistance } from '@/lib/utils'
import { QK } from '@/lib/queryKeys'
import { WorkLocation, AttendanceRecord } from '@/types'

// ── Constantes ────────────────────────────────────────────────────────────────

const GPS_THRESHOLD_METERS = 500

// ── Tipos locales ─────────────────────────────────────────────────────────────

type GpsState = 'idle' | 'loading' | 'ok' | 'error'

// ── Gradientes determinísticos por nombre de obra ─────────────────────────────
// Generamos un índice a partir del nombre para dar un gradiente único y
// consistente a cada obra sin necesitar campo de imagen en el backend.

const GRADIENTS: [string, string][] = [
  ['#1a2a4a', '#0e3a5c'],   // azul profundo
  ['#1a2e1a', '#0d3d1a'],   // verde oscuro
  ['#2e1a0e', '#3d1a00'],   // marrón tierra
  ['#1a1a2e', '#16213e'],   // navy violáceo
  ['#2e1a2e', '#1a0d26'],   // morado oscuro
  ['#2e2a1a', '#3d3000'],   // ocre oscuro
  ['#0e2e2e', '#003d3d'],   // teal oscuro
  ['#2e0e1a', '#3d0014'],   // rojo oscuro
]

function getGradient(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return GRADIENTS[hash % GRADIENTS.length]
}

// ── Subcomponente: tarjeta de obra ────────────────────────────────────────────

interface LocationCardProps {
  location: WorkLocation
  isSelected: boolean
  hasCheckinToday: boolean
  onSelect: (id: string) => void
}

function LocationCard({ location, isSelected, hasCheckinToday, onSelect }: LocationCardProps) {
  const [from, to] = getGradient(location.name)

  return (
    <motion.button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => {
        if (typeof navigator.vibrate === 'function') navigator.vibrate(50)
        onSelect(location.id)
      }}
      className="relative w-full text-left rounded-[18px] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)]"
      style={{
        minHeight: 140,
        border: isSelected
          ? '2px solid var(--signal)'
          : '2px solid rgba(255,255,255,0.06)',
        boxShadow: isSelected
          ? '0 0 0 1px rgba(0,212,255,0.2), 0 4px 20px rgba(0,0,0,0.4)'
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
      whileTap={{ scale: 0.97 }}
      animate={isSelected ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Fondo con gradiente */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      />

      {/* Overlay oscuro para legibilidad del texto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Capa de destello de selección */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            key="selection-glow"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.15) 0%, transparent 70%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4">
        {/* Fila superior: estado + checkmark */}
        <div className="flex items-start justify-between gap-2">
          {/* Badge estado obra */}
          {location.is_active ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
              {/* Punto verde pulsante */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                Activa
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-white/30" />
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">
                Inactiva
              </span>
            </div>
          )}

          {/* Indicador seleccionado */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--signal)' }}
            >
              <CheckCircle className="w-4 h-4 text-[var(--navy)]" />
            </motion.div>
          )}
        </div>

        {/* Nombre de la obra */}
        <div>
          {/* Badge "Ya ingresaste hoy" */}
          {hasCheckinToday && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2 text-[10px] font-bold uppercase tracking-wide"
              style={{
                background: 'rgba(0,212,255,0.2)',
                border: '1px solid rgba(0,212,255,0.4)',
                color: 'var(--signal)',
              }}
            >
              <CheckCircle className="w-3 h-3" />
              Ya ingresaste hoy
            </div>
          )}

          <h2
            className="font-display font-bold text-white leading-tight"
            style={{ fontSize: 'clamp(15px, 4vw, 18px)' }}
          >
            {location.name}
          </h2>

          {location.contractor && (
            <p className="text-[11px] text-white/60 font-dm mt-1 truncate">
              {location.contractor}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  )
}

// ── Skeleton de tarjeta ───────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      className="w-full rounded-[18px] animate-pulse"
      style={{
        minHeight: 140,
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(255,255,255,0.04)',
      }}
    />
  )
}

// ── Estado vacío ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* SVG amigable */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
        className="mb-6 opacity-60"
      >
        <circle cx="40" cy="40" r="36" fill="rgba(0,212,255,0.08)" stroke="rgba(0,212,255,0.2)" strokeWidth="1.5" />
        <path
          d="M40 22c-7.18 0-13 5.82-13 13 0 7.5 8.5 17.5 12.05 21.5a1.3 1.3 0 001.9 0C44.5 52.5 53 42.5 53 35c0-7.18-5.82-13-13-13z"
          fill="rgba(0,212,255,0.15)"
          stroke="rgba(0,212,255,0.4)"
          strokeWidth="1.5"
        />
        <circle cx="40" cy="35" r="4" fill="rgba(0,212,255,0.5)" />
        <path d="M28 60h24M32 65h16" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <p className="font-display font-semibold text-[var(--off-white)] text-lg mb-2">
        Sin obras asignadas
      </p>
      <p className="text-sm text-[var(--muted)] font-dm max-w-xs">
        Habla con tu administrador para que te asigne a una obra
      </p>
    </div>
  )
}

// ── Pantalla de obra única ────────────────────────────────────────────────────

interface SingleLocationViewProps {
  location: WorkLocation
  hasCheckinToday: boolean
  gpsState: GpsState
  gpsError: string | null
  distance: number | null
  onConfirm: () => void
}

function SingleLocationView({
  location,
  hasCheckinToday,
  gpsState,
  gpsError,
  distance,
  onConfirm,
}: SingleLocationViewProps) {
  const [from, to] = getGradient(location.name)

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-full px-6 pb-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Tarjeta grande de obra única */}
      <div
        className="w-full rounded-[24px] overflow-hidden mb-8"
        style={{
          background: `linear-gradient(150deg, ${from} 0%, ${to} 100%)`,
          border: '2px solid rgba(0,212,255,0.2)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Gradiente de texto */}
        <div
          className="p-8"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.6) 100%)',
          }}
        >
          {/* Indicador activa */}
          {location.is_active && (
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                Obra activa
              </span>
            </div>
          )}

          {hasCheckinToday && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4 text-xs font-bold uppercase tracking-wide"
              style={{
                background: 'rgba(0,212,255,0.2)',
                border: '1px solid rgba(0,212,255,0.4)',
                color: 'var(--signal)',
              }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Ya ingresaste hoy
            </div>
          )}

          <h2 className="font-display font-extrabold text-white text-3xl leading-tight mb-2">
            {location.name}
          </h2>
          {location.contractor && (
            <p className="text-white/60 font-dm text-sm">{location.contractor}</p>
          )}
        </div>
      </div>

      {/* Mensajes GPS */}
      <AnimatePresence mode="wait">
        {gpsState === 'error' && gpsError && (
          <motion.div
            key="gps-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="w-full flex items-start gap-3 p-4 rounded-[14px] mb-6"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-300 font-dm">{gpsError}</p>
          </motion.div>
        )}

        {gpsState === 'ok' && (
          <motion.div
            key="gps-ok"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="w-full flex items-center gap-3 p-4 rounded-[14px] mb-6"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
            }}
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <p className="text-sm text-emerald-300 font-dm">
              Ubicación verificada ({distance}m de la obra)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón enorme */}
      <button
        type="button"
        onClick={onConfirm}
        disabled={gpsState === 'loading' || gpsState === 'ok'}
        className="w-full rounded-[18px] font-display font-bold text-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
        style={{
          background: 'var(--signal)',
          color: 'var(--navy)',
          padding: '20px 24px',
          minHeight: 68,
          boxShadow: '0 4px 20px rgba(0,212,255,0.35)',
        }}
      >
        {gpsState === 'loading' ? (
          <span className="inline-flex items-center gap-3 justify-center">
            <span
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin inline-block shrink-0"
              style={{
                borderColor: 'rgba(12,22,36,0.5)',
                borderTopColor: 'transparent',
              }}
            />
            Verificando ubicación...
          </span>
        ) : (
          <span className="flex items-center gap-3 justify-center">
            <MapPin className="w-5 h-5 shrink-0" />
            Confirmar y entrar
          </span>
        )}
      </button>
    </motion.div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function LocationSelectPage() {
  const navigate = useNavigate()
  const { setWorkLocation, user } = useAuthStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [gpsState, setGpsState] = useState<GpsState>('idle')
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: locations = [], isLoading } = useQuery({
    queryKey: QK.workLocations(),
    queryFn: () => api.get<WorkLocation[]>('/work-locations').then((r) => r.data),
  })

  // Asistencia del día para mostrar el badge "Ya ingresaste hoy"
  const { data: attendanceRecord } = useQuery({
    queryKey: QK.attendance.today(),
    queryFn: () =>
      api
        .get<AttendanceRecord | null>('/attendance/today')
        .then((r) => r.data)
        .catch(() => null),
    staleTime: 60_000,
  })

  const selectedLocation = locations.find((l) => l.id === selectedId)
  const attendanceWorkLocationId = attendanceRecord?.work_location_id ?? null

  // ── Filtro de búsqueda ────────────────────────────────────────────────────

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return locations
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.contractor && l.contractor.toLowerCase().includes(q)),
    )
  }, [locations, searchQuery])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSelectLocation(id: string) {
    setSelectedId(id)
    setGpsState('idle')
    setGpsError(null)
    setDistance(null)
  }

  function handleConfirm() {
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
      (err) => {
        setGpsState('error')
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            'Permiso de ubicación denegado. Habilita el GPS en tu navegador e intenta de nuevo.',
          )
        } else if (err.code === err.TIMEOUT) {
          setGpsError(
            'La obtención de tu ubicación tardó demasiado. Verifica tu señal GPS e intenta de nuevo.',
          )
        } else {
          setGpsError(
            'No se pudo acceder a tu ubicación. Verifica que el GPS esté activo e intenta de nuevo.',
          )
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  // ── Estado cargando ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 bg-[var(--navy)] flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Header skeleton */}
        <div className="px-5 pt-12 pb-5">
          <div className="h-3 w-24 rounded bg-white/10 animate-pulse mb-3" />
          <div className="h-7 w-48 rounded-lg bg-white/10 animate-pulse mb-2" />
          {/* Buscador skeleton */}
          <div className="h-12 w-full rounded-[14px] bg-white/8 animate-pulse mt-4" />
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // ── Estado vacío ──────────────────────────────────────────────────────────

  if (locations.length === 0) {
    return (
      <div
        className="fixed inset-0 bg-[var(--navy)] flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-5 pt-12 pb-4">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-1">
            Ubicacion
          </p>
          <h1 className="font-display font-extrabold text-2xl text-[var(--off-white)] leading-tight">
            Selecciona tu obra
          </h1>
        </div>
        <EmptyState />
      </div>
    )
  }

  // ── Una sola obra: pantalla completa ──────────────────────────────────────

  if (locations.length === 1) {
    return (
      <div
        className="fixed inset-0 bg-[var(--navy)] flex flex-col"
        style={{
          paddingTop: 'env(safe-area-inset-top, 16px)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        <div className="px-5 pt-8 pb-2">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-1">
            Tu obra
          </p>
          <h1 className="font-display font-extrabold text-2xl text-[var(--off-white)] leading-tight">
            Confirma tu ubicación
          </h1>
        </div>
        <div className="flex-1 flex flex-col justify-center px-5">
          <SingleLocationView
            location={locations[0]}
            hasCheckinToday={attendanceWorkLocationId === locations[0].id}
            gpsState={gpsState}
            gpsError={gpsError}
            distance={distance}
            onConfirm={() => {
              setSelectedId(locations[0].id)
              handleConfirm()
            }}
          />
        </div>
      </div>
    )
  }

  // ── Vista múltiple: grid ──────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-[var(--navy)] flex flex-col overflow-auto"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="px-5 pt-12 pb-4 shrink-0">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-1">
          Ubicación
        </p>
        <h1 className="font-display font-extrabold text-2xl text-[var(--off-white)] leading-tight mb-4">
          Selecciona tu obra
        </h1>

        {/* Buscador grande */}
        <div
          className="flex items-center gap-3 rounded-[14px] px-4"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(0,212,255,0.15)',
            height: 52,
          }}
        >
          <Search
            className="w-5 h-5 shrink-0"
            style={{ color: 'var(--signal)' }}
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="¿En qué obra estás hoy?"
            className="flex-1 bg-transparent outline-none text-base font-dm placeholder:text-[var(--muted)] text-[var(--off-white)]"
            aria-label="Buscar obra"
          />
        </div>
      </div>

      {/* Grid de tarjetas */}
      <div
        className="flex-1 px-5 overflow-auto"
        style={{
          paddingBottom: selectedId
            ? 'calc(env(safe-area-inset-bottom, 16px) + 96px)'
            : 'calc(env(safe-area-inset-bottom, 16px) + 24px)',
        }}
        role="listbox"
        aria-label="Selecciona una obra"
      >
        {filteredLocations.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[var(--muted)] text-sm font-dm py-10"
          >
            No se encontraron obras con "{searchQuery}"
          </motion.p>
        ) : (
          <motion.div
            className="grid gap-3"
            style={{
              gridTemplateColumns: 'repeat(2, 1fr)',
            }}
          >
            {filteredLocations.map((loc, index) => (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.06,
                  duration: 0.35,
                  ease: 'easeOut',
                }}
              >
                <LocationCard
                  location={loc}
                  isSelected={selectedId === loc.id}
                  hasCheckinToday={attendanceWorkLocationId === loc.id}
                  onSelect={handleSelectLocation}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Mensajes GPS bajo el grid */}
        <AnimatePresence>
          {gpsState === 'error' && gpsError && (
            <motion.div
              key="gps-error-grid"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="flex items-start gap-3 p-4 rounded-[14px] mt-4"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-300 font-dm">{gpsError}</p>
            </motion.div>
          )}

          {gpsState === 'ok' && (
            <motion.div
              key="gps-ok-grid"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="status"
              className="flex items-center gap-3 p-4 rounded-[14px] mt-4"
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
              }}
            >
              <CheckCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <p className="text-sm text-emerald-300 font-dm">
                Ubicación verificada ({distance}m de la obra)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botón confirmar fijo (aparece al seleccionar) */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            key="confirm-bar"
            className="fixed bottom-0 left-0 right-0 shrink-0"
            style={{
              padding: 'calc(env(safe-area-inset-bottom, 16px) + 16px) 20px 0',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)',
              background:
                'linear-gradient(to top, var(--navy) 70%, transparent 100%)',
            }}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <button
              type="button"
              onClick={handleConfirm}
              disabled={gpsState === 'loading' || gpsState === 'ok'}
              className="w-full rounded-[16px] font-display font-bold text-lg transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
              style={{
                background: 'var(--signal)',
                color: 'var(--navy)',
                padding: '18px 24px',
                minHeight: 60,
                boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
              }}
            >
              {gpsState === 'loading' ? (
                <span className="inline-flex items-center gap-3 justify-center">
                  <span
                    className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin inline-block shrink-0"
                    style={{
                      borderColor: 'rgba(12,22,36,0.5)',
                      borderTopColor: 'transparent',
                    }}
                  />
                  Verificando ubicación...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <MapPin className="w-5 h-5 shrink-0" />
                  Confirmar y entrar
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
