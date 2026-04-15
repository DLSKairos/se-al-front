import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Clock } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { AttendanceRecord } from '@/types'
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  useToast,
} from '@/components/ui'
import { downloadFile } from '@/lib/utils'

type Tab = 'records' | 'open' | 'export'

interface RecordFilters {
  userId: string
  startDate: string
  endDate: string
  page: number
}

function formatMinutes(minutes: number | null) {
  if (minutes === null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function elapsed(entryTime: string) {
  const diff = Date.now() - new Date(entryTime).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}

function RecordsTab() {
  const [filters, setFilters] = useState<RecordFilters>({
    userId: '',
    startDate: '',
    endDate: '',
    page: 1,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: QK.attendance.list(filters),
    queryFn: () =>
      api
        .get<{ data: AttendanceRecord[]; total: number; pages: number }>(
          '/attendance',
          {
            params: {
              page: filters.page,
              limit: 20,
              ...(filters.userId ? { userId: filters.userId } : {}),
              ...(filters.startDate ? { startDate: filters.startDate } : {}),
              ...(filters.endDate ? { endDate: filters.endDate } : {}),
            },
          }
        )
        .then((r) => r.data),
  })

  const records = data?.data ?? []
  const totalPages = data?.pages ?? 1

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)] font-['DM_Sans']">
            Buscar usuario
          </label>
          <input
            type="text"
            value={filters.userId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, userId: e.target.value, page: 1 }))
            }
            placeholder="Nombre o ID"
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all w-48"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)] font-['DM_Sans']">
            Desde
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((f) => ({ ...f, startDate: e.target.value, page: 1 }))
            }
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)] font-['DM_Sans']">
            Hasta
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((f) => ({ ...f, endDate: e.target.value, page: 1 }))
            }
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ userId: '', startDate: '', endDate: '', page: 1 })
          }
        >
          Limpiar filtros
        </Button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <LoadingSpinner label="Cargando registros..." />
      ) : error ? (
        <ErrorMessage message="Error al cargar los registros" />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-['DM_Sans']">
              <thead>
                <tr className="border-b border-white/5">
                  {['Usuario', 'Obra', 'Fecha', 'Entrada', 'Salida', 'Almuerzo', 'Total'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left font-display font-semibold text-xs text-[var(--muted)] uppercase tracking-wider pb-3 pt-4 px-4"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr
                    key={rec.id}
                    className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors ${
                      i % 2 === 1 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-[var(--off-white)] font-medium">
                      {rec.user?.name ?? rec.user_id}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)]">
                      {rec.work_location?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)] whitespace-nowrap">
                      {new Date(rec.service_date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-3 px-4 text-[var(--off-white)]">
                      {formatTime(rec.entry_time)}
                    </td>
                    <td className="py-3 px-4 text-[var(--off-white)]">
                      {formatTime(rec.exit_time)}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)]">
                      {rec.lunch_minutes !== null ? `${rec.lunch_minutes} min` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[var(--off-white)] font-medium">
                      {formatMinutes(rec.total_minutes)}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-[var(--muted)] text-sm"
                    >
                      No hay registros para los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <span className="text-xs text-[var(--muted)] font-['DM_Sans']">
                Página {filters.page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: f.page - 1 }))
                  }
                  disabled={filters.page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: f.page + 1 }))
                  }
                  disabled={filters.page >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OpenShiftsTab() {
  const { data: records = [], isLoading, error } = useQuery({
    queryKey: QK.attendance.open(),
    queryFn: () =>
      api.get<AttendanceRecord[]>('/attendance/open').then((r) => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) return <LoadingSpinner label="Cargando jornadas abiertas..." />
  if (error) return <ErrorMessage message="Error al cargar las jornadas abiertas" />

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-['DM_Sans']">
          <thead>
            <tr className="border-b border-white/5">
              {['Usuario', 'Obra', 'Fecha', 'Entrada', 'Tiempo transcurrido'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left font-display font-semibold text-xs text-[var(--muted)] uppercase tracking-wider pb-3 pt-4 px-4"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {records.map((rec, i) => (
              <tr
                key={rec.id}
                className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors ${
                  i % 2 === 1 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <td className="py-3 px-4 text-[var(--off-white)] font-medium">
                  {rec.user?.name ?? rec.user_id}
                </td>
                <td className="py-3 px-4 text-[var(--muted)]">
                  {rec.work_location?.name ?? '—'}
                </td>
                <td className="py-3 px-4 text-[var(--muted)] whitespace-nowrap">
                  {new Date(rec.service_date).toLocaleDateString('es-CO')}
                </td>
                <td className="py-3 px-4 text-[var(--off-white)]">
                  {formatTime(rec.entry_time)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium font-mono">
                      {elapsed(rec.entry_time)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-[var(--muted)] text-sm"
                >
                  No hay jornadas abiertas en este momento
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExportTab() {
  const toast = useToast()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [userId, setUserId] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) {
      toast.error('Las fechas de inicio y fin son obligatorias')
      return
    }
    setIsExporting(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      if (userId) params.set('userId', userId)
      await downloadFile(
        `/attendance/export?${params.toString()}`,
        `asistencia_${startDate}_${endDate}.xlsx`
      )
      toast.success('Exportación descargada correctamente')
    } catch {
      toast.error('Error al exportar el archivo')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-md">
      <div className="glass-card p-5">
        <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base mb-4">
          Exportar registros a Excel
        </h2>
        <form onSubmit={handleExport} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
              Fecha inicio <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
              Fecha fin <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--muted)] font-['DM_Sans']">
              Usuario (opcional)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="ID del usuario"
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>
          <Button type="submit" loading={isExporting} className="w-full">
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function AttendanceAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('records')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'records', label: 'Registros' },
    { id: 'open', label: 'Jornadas abiertas' },
    { id: 'export', label: 'Exportar' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
          Asistencia
        </h1>
        <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
          Consulta y gestiona los registros de asistencia
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-['DM_Sans'] rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--signal)] text-[var(--navy)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--off-white)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'records' && <RecordsTab />}
      {activeTab === 'open' && <OpenShiftsTab />}
      {activeTab === 'export' && <ExportTab />}
    </div>
  )
}
