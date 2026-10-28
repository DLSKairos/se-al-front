import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { FileText, CheckCircle, Clock, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import {
  StatCard,
  LoadingSpinner,
  ErrorMessage,
  SubmissionStatusBadge,
} from '@/components/ui'
import { DashboardStats, FormTemplate, SubmissionStatus } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'

const PIE_COLORS: Record<string, string> = {
  APPROVED: 'var(--ok)',
  SUBMITTED: 'var(--info)',
  PENDING_SIGNATURES: 'var(--warn)',
  REJECTED:  'var(--danger)',
  DRAFT:     'var(--fg-muted)',
}

const TOOLTIP_STYLE = {
  background: 'var(--navy-mid)',
  border: '1px solid color-mix(in srgb,var(--fg) 10%,transparent)',
  borderRadius: 8,
  color: 'var(--off-white)',
}

export default function AdminDashboardPage() {
  usePageTitle('Dashboard')

  const [templateId, setTemplateId] = useState<string>('')

  const { data: stats, isLoading, error } = useQuery({
    queryKey: QK.submissions.stats({ templateId }),
    queryFn: () =>
      api
        .get<DashboardStats>('/form-submissions/stats', {
          params: templateId ? { templateId } : {},
        })
        .then((r) => r.data),
  })

  const { data: templates = [] } = useQuery({
    queryKey: QK.templates.admin(),
    queryFn: () =>
      api.get<FormTemplate[]>('/form-templates/admin').then((r) => r.data),
  })

  if (isLoading) return <LoadingSpinner label="Cargando estadísticas..." />
  if (error || !stats)
    return <ErrorMessage message="Error al cargar el dashboard" />

  const pieData = Object.entries(stats.by_status)
    .map(([key, value]) => ({
      name:  key,
      value,
      color: PIE_COLORS[key] ?? 'var(--fg-muted)',
    }))
    .filter((d) => d.value > 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-display">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5 font-body">
            Resumen de actividad de tu organización
          </p>
        </div>

        {/* Selector de template */}
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          aria-label="Filtrar por formulario"
          className="bg-[color-mix(in_srgb,var(--fg)_5%,transparent)] border border-[color:var(--line)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--brand)_10%,transparent)] transition-all"
        >
          <option value="">Todos los formularios</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Formularios enviados"
          value={stats.total_submissions}
          icon={FileText}
          variant="signal"
        />
        <StatCard
          title="Aprobados"
          value={stats.by_status.APPROVED ?? 0}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Enviados"
          value={stats.by_status.SUBMITTED ?? 0}
          icon={Clock}
          variant="info"
        />
        <StatCard
          title="Rechazados"
          value={stats.by_status.REJECTED ?? 0}
          icon={XCircle}
          variant="danger"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tendencia mensual */}
        <div className="lg:col-span-2 glass-card p-5 min-w-0">
          <h2 className="font-display font-semibold text-[var(--off-white)] mb-4 text-sm">
            Tendencia mensual
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.trend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="color-mix(in srgb,var(--fg) 5%,transparent)"
              />
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
              />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="submissions"
                stroke="var(--signal)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut por estado */}
        <div className="glass-card p-5 min-w-0">
          <h2 className="font-display font-semibold text-[var(--off-white)] mb-4 text-sm">
            Por estado
          </h2>
          {pieData.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {[...pieData].sort((x, y) => y.value - x.value).map((d) => {
                const total = pieData.reduce((n, x) => n + x.value, 0)
                return (
                  <li key={d.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <SubmissionStatusBadge status={d.name as SubmissionStatus} />
                      <span className="font-display font-bold text-xl text-[var(--fg)] tabular-nums">{d.value} envíos</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--wash-strong)] overflow-hidden" aria-hidden="true">
                      <div className="h-full rounded-full" style={{ width: `${(d.value / total) * 100}%`, background: d.color }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[var(--fg-muted)] text-base font-body">
              Sin datos
            </div>
          )}
        </div>
      </div>

      {/* Tabla de actividad reciente */}
      <div className="glass-card p-5 min-w-0">
        <h2 className="font-display font-semibold text-[var(--off-white)] mb-4 text-sm">
          Actividad reciente
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-white/5">
                {['Usuario', 'Formulario', 'Obra', 'Fecha', 'Estado'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left font-display font-semibold text-xs text-[var(--muted)] pb-3 pr-4"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((item, i) => (
                <tr
                  key={item.id}
                  className={`border-b border-white/5 hover:bg-[color-mix(in_srgb,var(--surface)_30%,transparent)] transition-colors ${
                    i % 2 === 1 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-3 pr-4 text-[var(--off-white)]">
                    {item.submitted_by}
                  </td>
                  <td className="py-3 pr-4 text-[var(--muted)]">
                    {item.template_name}
                  </td>
                  <td className="py-3 pr-4 text-[var(--muted)]">
                    {item.work_location}
                  </td>
                  <td className="py-3 pr-4 text-[var(--muted)] whitespace-nowrap">
                    {formatDateTime(item.submitted_at)}
                  </td>
                  <td className="py-3">
                    <SubmissionStatusBadge
                      status={item.status as SubmissionStatus}
                    />
                  </td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-[var(--muted)] text-sm"
                  >
                    Sin actividad reciente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
