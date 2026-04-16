import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, LogIn, LogOut, Clock, Coffee } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { AttendanceRecord } from '@/types'
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  Modal,
  useToast,
} from '@/components/ui'
import { SOSButton } from '@/components/ui/SOSButton'


// ── Helpers ───────────────────────────────────────────────────────────────────

function calcWorkedTime(entryTimeISO: string, serviceDateISO: string): string {
  // Prisma devuelve campos TIME(6) como 1970-01-01T{hora_utc}Z.
  // Combinamos con service_date para reconstruir el timestamp real de entrada.
  const msInDay     = 24 * 60 * 60 * 1000
  const entryTime   = new Date(entryTimeISO).getTime() % msInDay
  const serviceDate = new Date(serviceDateISO).getTime()
  const entryMs     = serviceDate + entryTime
  const diffMs      = Math.max(0, Date.now() - entryMs)
  const minutes     = Math.floor(diffMs / 60000)
  const hours       = Math.floor(minutes / 60)
  const mins        = minutes % 60
  return `${hours}h ${mins}m`
}

function formatEntryTime(entryTimeISO: string): string {
  // entry_time de Prisma está anclado a 1970-01-01; extraemos solo la hora.
  return new Date(entryTimeISO).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}h ${m}m`
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const navigate    = useNavigate()
  const toast       = useToast()
  const queryClient = useQueryClient()

  const [exitModalOpen, setExitModalOpen] = useState(false)
  const [lunchMinutes, setLunchMinutes]   = useState<number | ''>(0)

  // Reloj en tiempo real — solo display, no afecta la lógica
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Query ─────────────────────────────────────────────────────────────────
  const {
    data: record,
    isLoading,
    error,
  } = useQuery({
    queryKey: QK.attendance.today(),
    queryFn: () =>
      api
        .get<AttendanceRecord | null>('/attendance/today')
        .then((r) => r.data)
        .catch(() => null),
  })

  // ── Mutation: registrar entrada ───────────────────────────────────────────
  const entryMutation = useMutation({
    mutationFn: () => api.post('/attendance/entry'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.attendance.today() })
      toast.success('Entrada registrada correctamente')
    },
    onError: () => toast.error('No se pudo registrar la entrada. Intenta de nuevo.'),
  })

  // ── Mutation: registrar salida ────────────────────────────────────────────
  const exitMutation = useMutation({
    mutationFn: (lunch: number) =>
      api.post('/attendance/exit', { lunch_minutes: lunch }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.attendance.today() })
      setExitModalOpen(false)
      toast.success('Salida registrada correctamente')
    },
    onError: () => toast.error('No se pudo registrar la salida. Intenta de nuevo.'),
  })

  const handleExitConfirm = () => {
    const lunch = lunchMinutes === '' ? 0 : lunchMinutes
    exitMutation.mutate(lunch)
  }

  // ── Estados de carga ─────────────────────────────────────────────────────

  if (isLoading) return <LoadingSpinner fullscreen label="Cargando asistencia..." />

  if (error) {
    return (
      <div
        className="fixed inset-0 bg-[var(--navy)] flex items-center justify-center p-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <ErrorMessage
          title="Error al cargar asistencia"
          message="No se pudo obtener el registro del dia."
        />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-[var(--navy)] flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="flex items-center px-6 pt-4 pb-2 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-white/5 hover:bg-white/10 transition-colors text-[var(--muted)] hover:text-[var(--off-white)] mr-3"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)]">
            Registro
          </p>
          <h1 className="font-display font-bold text-base text-[var(--off-white)]">
            Asistencia
          </h1>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto flex flex-col">

        {/* ── Sin registro ─────────────────────────────────────────────── */}
        {!record && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-[320px] flex flex-col items-center">
              {/* Reloj digital */}
              <div className="font-display font-extrabold text-[56px] text-[var(--signal)] leading-none my-6 tabular-nums">
                {now.toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>

              <p className="text-sm text-[var(--muted)] font-dm mb-2">
                {now.toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>

              <h2 className="font-display font-extrabold text-[28px] text-[var(--off-white)] mb-2 text-center">
                Sin entrada registrada
              </h2>
              <p className="text-sm text-[var(--muted)] font-dm text-center mb-8">
                Registra tu llegada para comenzar la jornada.
              </p>

              <button
                type="button"
                disabled={entryMutation.isPending}
                onClick={() => entryMutation.mutate()}
                className="btn-primary-gradient w-full max-w-[320px] py-4 rounded-[14px] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <LogIn className="w-5 h-5" aria-hidden="true" />
                {entryMutation.isPending ? 'Registrando…' : 'Registrar entrada'}
              </button>
            </div>
          </div>
        )}

        {/* ── Con entrada, sin salida ───────────────────────────────────── */}
        {record && !record.exit_time && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-[320px] flex flex-col items-center">
              {/* Reloj digital */}
              <div className="font-display font-extrabold text-[56px] text-[var(--signal)] leading-none my-6 tabular-nums">
                {now.toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>

              <p className="text-sm text-[var(--muted)] font-dm mb-8">
                {now.toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>

              <div className="glass p-6 rounded-[20px] w-full mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[12px] bg-[var(--signal-dim)] flex items-center justify-center border border-[rgba(0,212,255,0.2)]">
                    <Clock className="w-5 h-5 text-[var(--signal)]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)]">En jornada desde</p>
                    <p className="text-base font-display font-semibold text-[var(--off-white)]">
                      {formatEntryTime(record.entry_time)}
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-0.5">Tiempo transcurrido</p>
                  <p className="text-2xl font-display font-bold text-gradient">
                    {calcWorkedTime(record.entry_time, record.service_date)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExitModalOpen(true)}
                className="w-full py-4 rounded-[14px] border border-[rgba(0,212,255,0.25)] text-[var(--signal)] font-display font-bold text-[13px] tracking-[0.1em] uppercase active:scale-[0.97] transition-all flex items-center justify-center gap-2 bg-transparent"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                Registrar salida
              </button>
            </div>
          </div>
        )}

        {/* ── Jornada completa ─────────────────────────────────────────── */}
        {record && record.exit_time && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-[320px]">
              <div className="glass p-6 rounded-[20px]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[9px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    Completada
                  </span>
                </div>
                <h2 className="font-display font-bold text-lg text-[var(--off-white)] mb-4">
                  Jornada completada
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-0.5">Entrada</p>
                    <p className="text-sm text-[var(--off-white)] font-dm font-medium">
                      {new Date(record.entry_time).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Bogota',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-0.5">Salida</p>
                    <p className="text-sm text-[var(--off-white)] font-dm font-medium">
                      {new Date(record.exit_time).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Bogota',
                      })}
                    </p>
                  </div>
                  {record.lunch_minutes !== null && (
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-0.5">Almuerzo</p>
                      <p className="text-sm text-[var(--off-white)] font-dm font-medium">
                        {record.lunch_minutes} min
                      </p>
                    </div>
                  )}
                  {record.total_minutes !== null && (
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-0.5">Total trabajado</p>
                      <p className="text-sm text-[var(--signal)] font-dm font-semibold">
                        {formatMinutes(record.total_minutes)}
                      </p>
                    </div>
                  )}
                </div>

                {(record.extra_day_minutes ?? 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] mb-2">Horas extras</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(record.extra_day_minutes ?? 0) > 0 && (
                        <div className="px-3 py-2 rounded-[10px] bg-amber-500/10 border border-amber-500/20">
                          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--muted)]">Diurnas</p>
                          <p className="text-sm text-amber-300 font-dm font-semibold">
                            {formatMinutes(record.extra_day_minutes!)}
                          </p>
                        </div>
                      )}
                      {(record.extra_night_minutes ?? 0) > 0 && (
                        <div className="px-3 py-2 rounded-[10px] bg-[var(--signal-dim)] border border-[rgba(0,212,255,0.2)]">
                          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--muted)]">Nocturnas</p>
                          <p className="text-sm text-[var(--signal)] font-dm font-semibold">
                            {formatMinutes(record.extra_night_minutes!)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de salida */}
      <Modal
        open={exitModalOpen}
        onOpenChange={setExitModalOpen}
        title="Registrar salida"
        description="Indica cuantos minutos tomaste de almuerzo (puede ser 0)."
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="lunch-minutes"
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-2 block"
            >
              <span className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[var(--muted)]" aria-hidden="true" />
                Minutos de almuerzo
              </span>
            </label>
            <input
              id="lunch-minutes"
              type="number"
              min={0}
              max={120}
              value={lunchMinutes}
              onChange={(e) =>
                setLunchMinutes(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[14px] px-5 py-4 text-base text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] transition-all [color-scheme:dark]"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setExitModalOpen(false)}
              disabled={exitMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              loading={exitMutation.isPending}
              onClick={handleExitConfirm}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Confirmar salida
            </Button>
          </div>
        </div>
      </Modal>

      <SOSButton />
    </div>
  )
}
