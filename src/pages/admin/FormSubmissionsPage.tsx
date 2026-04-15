import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  SubmissionStatusBadge,
  useToast,
} from '@/components/ui'
import { FormSubmission, FormTemplate, SubmissionStatus } from '@/types'
import { formatDateTime, downloadFile } from '@/lib/utils'

interface SubmissionsFilters {
  search: string
  status: string
  templateId: string
  dateFrom: string
  dateTo: string
  page: number
}

interface SubmissionsResponse {
  items: FormSubmission[]
  total: number
  page: number
  limit: number
}

const LIMIT = 20

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SUBMITTED', label: 'Pendiente' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'REJECTED', label: 'Rechazado' },
]

const INPUT_CLASS =
  'bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all placeholder:text-[var(--muted)] w-full'

const SELECT_CLASS =
  'bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all'

export default function FormSubmissionsPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [filters, setFilters] = useState<SubmissionsFilters>({
    search: '',
    status: '',
    templateId: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  })
  const [isExporting, setIsExporting] = useState(false)

  const queryFilters = {
    search: filters.search,
    status: filters.status,
    templateId: filters.templateId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    page: filters.page,
    limit: LIMIT,
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QK.submissions.list(queryFilters),
    queryFn: () =>
      api
        .get<SubmissionsResponse>('/form-submissions', { params: queryFilters })
        .then((r) => r.data),
  })

  const { data: templates = [] } = useQuery({
    queryKey: QK.templates.admin(),
    queryFn: () =>
      api.get<FormTemplate[]>('/form-templates/admin').then((r) => r.data),
  })

  const updateFilter = useCallback(
    <K extends keyof SubmissionsFilters>(key: K, value: SubmissionsFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: key !== 'page' ? 1 : (value as number) }))
    },
    [],
  )

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.status) params.set('status', filters.status)
      if (filters.templateId) params.set('templateId', filters.templateId)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      const query = params.toString()
      await downloadFile(
        `/form-submissions/export/excel${query ? `?${query}` : ''}`,
        `submissions-${new Date().toISOString().slice(0, 10)}.xlsx`,
      )
      toast.success('Archivo descargado correctamente')
    } catch {
      toast.error('Error al exportar el archivo')
    } finally {
      setIsExporting(false)
    }
  }

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
            Submissions
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
            Gestiona y revisa todos los formularios enviados
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExport}
          loading={isExporting}
          disabled={isExporting}
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Filtros */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Buscador */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Buscar por usuario o formulario..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className={`${INPUT_CLASS} pl-9`}
              aria-label="Buscar submissions"
            />
          </div>

          {/* Estado */}
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            aria-label="Filtrar por estado"
            className={SELECT_CLASS}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Template */}
          <select
            value={filters.templateId}
            onChange={(e) => updateFilter('templateId', e.target.value)}
            aria-label="Filtrar por formulario"
            className={SELECT_CLASS}
          >
            <option value="">Todos los formularios</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Rango de fechas */}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              aria-label="Fecha desde"
              className={SELECT_CLASS}
              title="Fecha desde"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              aria-label="Fecha hasta"
              className={SELECT_CLASS}
              title="Fecha hasta"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Cargando submissions..." />
        ) : error ? (
          <ErrorMessage
            message="Error al cargar los submissions"
            onRetry={() => refetch()}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-['DM_Sans']">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Formulario', 'Usuario', 'Obra', 'Estado', 'Fecha', 'Acciones'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left font-display font-semibold text-xs text-[var(--muted)] uppercase tracking-wider pb-3 pt-5 px-5 pr-4"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data?.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="w-10 h-10 text-[var(--muted)]" />
                          <p className="text-[var(--muted)] text-sm">
                            No se encontraron submissions
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data?.items.map((item, i) => (
                      <tr
                        key={item.id}
                        className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors cursor-pointer ${
                          i % 2 === 1 ? 'bg-white/[0.02]' : ''
                        }`}
                        onClick={() => navigate(`/admin/submissions/${item.id}`)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate(`/admin/submissions/${item.id}`)
                          }
                        }}
                        aria-label={`Ver submission de ${item.submitter?.name ?? item.submitted_by}`}
                      >
                        <td className="py-3 px-5 pr-4 text-[var(--off-white)] font-medium">
                          {item.template?.name ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-[var(--muted)]">
                          {item.submitter?.name ?? item.submitted_by}
                        </td>
                        <td className="py-3 pr-4 text-[var(--muted)]">
                          {item.work_location?.name ?? '—'}
                        </td>
                        <td className="py-3 pr-4">
                          <SubmissionStatusBadge status={item.status as SubmissionStatus} />
                        </td>
                        <td className="py-3 pr-4 text-[var(--muted)] whitespace-nowrap">
                          {formatDateTime(item.submitted_at)}
                        </td>
                        <td className="py-3 pr-5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/admin/submissions/${item.id}`)
                            }}
                          >
                            Ver detalle
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {data && data.total > LIMIT && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
                  {data.total} resultado{data.total !== 1 ? 's' : ''} —
                  Página {filters.page} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter('page', filters.page - 1)}
                    disabled={filters.page <= 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter('page', filters.page + 1)}
                    disabled={filters.page >= totalPages}
                    aria-label="Página siguiente"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
