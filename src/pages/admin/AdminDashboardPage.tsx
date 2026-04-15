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
  PieChart,
  Pie,
  Cell,
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

const PIE_COLORS: Record<string, string> = {
  APPROVED: '#10b981',
  SUBMITTED: '#f59e0b',
  REJECTED:  '#ef4444',
  DRAFT:     '#6b7280',
}

const TOOLTIP_STYLE = {
  background: 'var(--navy-mid)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: 'var(--off-white)',
}

export default function AdminDashboardPage() {
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
      color: PIE_COLORS[key] ?? '#6b7280',
    }))
    .filter((d) => d.value > 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
            Resumen de actividad de tu organización
          </p>
        </div>

        {/* Selector de template */}
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          aria-label="Filtrar por formulario"
          className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
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
          title="Total submissions"
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
          title="Pendientes"
          value={stats.by_status.SUBMITTED ?? 0}
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Rechazados"
          value={stats.by_status.REJECTED ?? 0}
          icon={XCircle}
          variant="default"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tendencia mensual */}
        <div className="lg:col-span-2 glass-card p-5 min-w-0">
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-4 text-sm">
            Tendencia mensual
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.trend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(240,244,248,0.05)"
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
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-4 text-sm">
            Por estado
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[var(--muted)] text-sm font-['DM_Sans']">
              Sin datos
            </div>
          )}
        </div>
      </div>

      {/* Tabla de actividad reciente */}
      <div className="glass-card p-5 min-w-0">
        <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-4 text-sm">
          Actividad reciente
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['DM_Sans']">
            <thead>
              <tr className="border-b border-white/5">
                {['Usuario', 'Formulario', 'Obra', 'Fecha', 'Estado'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left font-display font-semibold text-xs text-[var(--muted)] uppercase tracking-wider pb-3 pr-4"
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
                  className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors ${
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
