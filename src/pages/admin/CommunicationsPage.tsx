/**
 * Ruta: /admin/comunicaciones
 *
 * Panel de creación y envío de notificaciones masivas a operarios.
 * Requiere rol ADMIN o SUPER_ADMIN (protegido por RoleGuard).
 */

import { useState, useMemo } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'
import {
  Megaphone,
  Send,
  Users,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Link2,
  AlertTriangle,
  FileCheck,
  Bell,
  Search,
  X,
  Inbox,
  ChevronDown,
} from 'lucide-react'
import api, { notificationsApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import {
  Button,
  Badge,
  LoadingSpinner,
  ErrorMessage,
  Modal,
  useToast,
} from '@/components/ui'
import type {
  WorkLocation,
  User as UserType,
  AppNotification,
  BulkNotificationTarget,
  CreateBulkNotificationDto,
  NotificationType,
} from '@/types'

// ── Constantes de estilo (siguiendo UsersPage) ────────────────────────────────

const INPUT_CLASS =
  'w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all placeholder:text-[var(--muted)]'

const TEXTAREA_CLASS =
  'w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all placeholder:text-[var(--muted)] resize-none'

const SELECT_CLASS =
  'w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] transition-all'

const LABEL_CLASS =
  'block text-xs text-[var(--muted)] font-dm uppercase tracking-wide mb-1.5'

const MAX_TITLE = 60
const MAX_BODY = 200
const SENT_PAGE_SIZE = 15

// ── Helper: tiempo relativo en español ────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'ayer'
  const d = new Date(dateStr)
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

// ── Icono por tipo de notificación ────────────────────────────────────────────

interface TypeConfig {
  Icon: React.ElementType
  color: string
  bg: string
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  FORM_APPROVED: { Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  FORM_REJECTED: { Icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
  FORM_PENDING_SIGNATURE: { Icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  FORM_SUBMITTED: { Icon: FileCheck, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  MAGIC_LINK_SENT: { Icon: Link2, color: 'text-[var(--signal)]', bg: 'bg-[rgba(0,212,255,0.12)]' },
  SYSTEM_ALERT: { Icon: AlertTriangle, color: 'text-amber-300', bg: 'bg-amber-400/10' },
  CUSTOM_ADMIN: { Icon: Megaphone, color: 'text-violet-400', bg: 'bg-violet-500/15' },
}

// ── Componente: preview de notificación ──────────────────────────────────────

interface NotificationPreviewProps {
  title: string
  body: string
}

function NotificationPreview({ title, body }: NotificationPreviewProps) {
  const cfg = TYPE_CONFIG.CUSTOM_ADMIN
  const Icon = cfg.Icon

  const hasContent = title.trim() || body.trim()

  return (
    <div
      aria-label="Vista previa de la notificación"
      className="rounded-[var(--radius-glass)] border border-white/[0.08] overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #162238 0%, #111E30 100%)' }}
    >
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
        <Bell className="w-3.5 h-3.5 text-[var(--signal)]" aria-hidden="true" />
        <span className="text-xs text-[var(--muted)] font-dm uppercase tracking-wide">
          Vista previa
        </span>
      </div>

      {hasContent ? (
        <div className="flex items-start gap-3 p-4">
          <div className={`shrink-0 w-9 h-9 rounded-[var(--radius-glass-md)] flex items-center justify-center ${cfg.bg}`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--off-white)] font-syne leading-snug truncate">
              {title || 'Título de la notificación'}
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5 font-dm line-clamp-2">
              {body || 'El mensaje aparecerá aquí...'}
            </p>
            <p className="text-[10px] text-[var(--muted)]/50 mt-1 font-dm">hace un momento</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Bell className="w-8 h-8 text-[var(--muted)]/30" aria-hidden="true" />
          <p className="text-xs text-[var(--muted)] font-dm">
            Escribe un título y mensaje para ver la vista previa
          </p>
        </div>
      )}
    </div>
  )
}

// ── Componente: multiselect de usuarios con búsqueda ─────────────────────────

interface UserMultiSelectProps {
  users: UserType[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

function UserMultiSelect({ users, selectedIds, onChange, disabled }: UserMultiSelectProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.identification_number.toLowerCase().includes(q),
    )
  }, [users, search])

  const selected = users.filter((u) => selectedIds.includes(u.id))

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function remove(id: string) {
    onChange(selectedIds.filter((sid) => sid !== id))
  }

  return (
    <div className="relative">
      {/* Chips de seleccionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2" role="list" aria-label="Usuarios seleccionados">
          {selected.map((u) => (
            <span
              key={u.id}
              role="listitem"
              className="inline-flex items-center gap-1 text-xs bg-[rgba(0,212,255,0.12)] text-[var(--signal)] rounded-[var(--radius-badge)] px-2 py-1 font-dm"
            >
              {u.name}
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Quitar ${u.name}`}
                  onClick={() => remove(u.id)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Buscar y seleccionar usuarios"
        onClick={() => setOpen((v) => !v)}
        className={`${INPUT_CLASS} flex items-center justify-between text-left`}
      >
        <span className={selected.length === 0 ? 'text-[var(--muted)]' : 'text-[var(--off-white)]'}>
          {selected.length === 0
            ? 'Buscar usuarios...'
            : `${selected.length} usuario${selected.length !== 1 ? 's' : ''} seleccionado${selected.length !== 1 ? 's' : ''}`}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label="Lista de usuarios"
          className="absolute top-full left-0 right-0 mt-1 z-30 rounded-[var(--radius-glass-md)] border border-white/[0.08] overflow-hidden shadow-glass"
          style={{ background: 'linear-gradient(160deg, #162238 0%, #111E30 100%)' }}
        >
          {/* Búsqueda */}
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar usuarios"
                className="w-full bg-white/5 border-0 rounded-[var(--radius-btn)] pl-9 pr-3 py-2 text-xs text-[var(--off-white)] font-dm outline-none placeholder:text-[var(--muted)]/60 focus:ring-1 focus:ring-[rgba(0,212,255,0.3)]"
                autoFocus
              />
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--muted)] text-center py-4 font-dm">
                Sin resultados
              </p>
            ) : (
              filtered.map((u) => {
                const checked = selectedIds.includes(u.id)
                return (
                  <button
                    key={u.id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors ${checked ? 'bg-[rgba(0,212,255,0.05)]' : ''}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[var(--signal)] border-[var(--signal)]' : 'border-white/20'}`}>
                      {checked && <CheckCircle2 className="w-3 h-3 text-[var(--navy)]" aria-hidden="true" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[var(--off-white)] font-dm truncate">{u.name}</p>
                      <p className="text-[10px] text-[var(--muted)] font-dm">{u.identification_number}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Cerrar */}
          <div className="border-t border-white/5 p-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-1.5 text-xs text-[var(--muted)] hover:text-[var(--off-white)] transition-colors font-dm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Formulario de envío ───────────────────────────────────────────────────────

interface SendFormState {
  title: string
  body: string
  target: BulkNotificationTarget
  work_location_id: string
  user_ids: string[]
}

const EMPTY_FORM: SendFormState = {
  title: '',
  body: '',
  target: 'ALL',
  work_location_id: '',
  user_ids: [],
}

function recipientsSummary(
  form: SendFormState,
  workLocations: WorkLocation[],
  users: UserType[],
): string {
  if (form.target === 'ALL') return 'Todos los operarios de la organización'
  if (form.target === 'SITE') {
    const loc = workLocations.find((l) => l.id === form.work_location_id)
    return loc ? `Obra: ${loc.name}` : 'Obra no seleccionada'
  }
  if (form.target === 'SPECIFIC') {
    const count = form.user_ids.length
    if (count === 0) return 'Sin usuarios seleccionados'
    const names = users
      .filter((u) => form.user_ids.includes(u.id))
      .map((u) => u.name)
      .slice(0, 3)
      .join(', ')
    return count > 3 ? `${names} y ${count - 3} más` : names
  }
  return ''
}

// ── Tabla de historial ────────────────────────────────────────────────────────

interface SentTableProps {
  notifications: AppNotification[]
  isLoading: boolean
  isError: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

function SentTable({
  notifications,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: SentTableProps) {
  if (isLoading) {
    return (
      <div className="glass-card">
        <LoadingSpinner label="Cargando historial..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="glass-card">
        <ErrorMessage message="Error al cargar el historial de notificaciones" />
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-dm">
          <thead>
            <tr className="border-b border-white/5">
              {['Fecha', 'Título', 'Mensaje', 'Creada por'].map((h) => (
                <th
                  key={h}
                  className="text-left font-syne font-semibold text-xs text-[var(--muted)] uppercase tracking-wider pb-3 pt-5 px-5 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {notifications.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Inbox className="w-10 h-10 text-[var(--muted)]/40" aria-hidden="true" />
                    <p className="text-[var(--muted)] text-sm">
                      Aun no has enviado notificaciones
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              notifications.map((n, i) => (
                <tr
                  key={n.id}
                  className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
                >
                  <td className="py-3 px-5 text-[var(--muted)] whitespace-nowrap">
                    <time dateTime={n.created_at} title={new Date(n.created_at).toLocaleString('es-CO')}>
                      {relativeTime(n.created_at)}
                    </time>
                  </td>
                  <td className="py-3 px-5 text-[var(--off-white)] font-medium max-w-[200px] truncate">
                    {n.title}
                  </td>
                  <td className="py-3 px-5 text-[var(--muted)] max-w-[280px] truncate">
                    {n.body}
                  </td>
                  <td className="py-3 px-5 text-[var(--muted)]">
                    {n.created_by_admin_id ? (
                      <Badge variant="info">Admin</Badge>
                    ) : (
                      <Badge variant="draft">Sistema</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="p-4 border-t border-white/5 text-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            loading={isFetchingNextPage}
          >
            Cargar más
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<SendFormState>(EMPTY_FORM)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // ── Datos de soporte ────────────────────────────────────────────────────

  const { data: workLocations = [] } = useQuery({
    queryKey: QK.workLocations(),
    queryFn: () => api.get<WorkLocation[]>('/work-locations').then((r) => r.data),
  })

  const { data: users = [] } = useQuery({
    queryKey: QK.users(),
    queryFn: () => api.get<UserType[]>('/users').then((r) => r.data),
    select: (data) => data.filter((u) => u.role === 'OPERATOR'),
  })

  // ── Historial de enviadas ───────────────────────────────────────────────

  interface SentPage { data: AppNotification[]; total: number }

  const sentQuery = useInfiniteQuery<SentPage>({
    queryKey: QK.adminNotificationsSent(),
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1
      const res = await notificationsApi.listSent({ page, limit: SENT_PAGE_SIZE })
      return res.data as SentPage
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    staleTime: 30_000,
  })

  const sentNotifications: AppNotification[] =
    sentQuery.data?.pages.flatMap((p) => p.data) ?? []

  // ── Mutación enviar ─────────────────────────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: (dto: CreateBulkNotificationDto) => notificationsApi.createBulk(dto),
    onSuccess: () => {
      toast.success('Notificaciones enviadas correctamente')
      setForm(EMPTY_FORM)
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: QK.adminNotificationsSent() })
    },
    onError: () => {
      toast.error('Error al enviar las notificaciones')
      setConfirmOpen(false)
    },
  })

  // ── Validación del formulario ───────────────────────────────────────────

  function isFormValid(): boolean {
    if (!form.title.trim() || !form.body.trim()) return false
    if (form.target === 'SITE' && !form.work_location_id) return false
    if (form.target === 'SPECIFIC' && form.user_ids.length === 0) return false
    return true
  }

  function handleSubmitIntent(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid()) return
    setConfirmOpen(true)
  }

  function handleConfirmSend() {
    const dto: CreateBulkNotificationDto = {
      title: form.title.trim(),
      body: form.body.trim(),
      target: form.target,
      ...(form.target === 'SITE' && { work_location_id: form.work_location_id }),
      ...(form.target === 'SPECIFIC' && { user_ids: form.user_ids }),
    }
    sendMutation.mutate(dto)
  }

  const summary = recipientsSummary(form, workLocations, users)

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--off-white)] font-syne">
          Comunicaciones
        </h1>
        <p className="text-sm text-[var(--muted)] mt-0.5 font-dm">
          Envia notificaciones a tus operarios de forma directa
        </p>
      </div>

      {/* Layout: formulario + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: formulario */}
        <section aria-labelledby="form-section-title">
          <h2
            id="form-section-title"
            className="text-base font-semibold text-[var(--off-white)] font-syne mb-4"
          >
            Nueva notificacion
          </h2>

          <form
            onSubmit={handleSubmitIntent}
            className="glass-card p-6 flex flex-col gap-5"
            noValidate
          >
            {/* Título */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="notif-title" className={LABEL_CLASS}>
                  Titulo *
                </label>
                <span
                  aria-live="polite"
                  className={`text-xs font-dm ${form.title.length > MAX_TITLE - 10 ? 'text-amber-400' : 'text-[var(--muted)]'}`}
                >
                  {form.title.length}/{MAX_TITLE}
                </span>
              </div>
              <input
                id="notif-title"
                type="text"
                required
                maxLength={MAX_TITLE}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Reunion de seguridad manana"
                aria-describedby="title-hint"
                className={INPUT_CLASS}
              />
              <p id="title-hint" className="text-[10px] text-[var(--muted)] mt-1 font-dm">
                Maximo {MAX_TITLE} caracteres
              </p>
            </div>

            {/* Mensaje */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="notif-body" className={LABEL_CLASS}>
                  Mensaje *
                </label>
                <span
                  aria-live="polite"
                  className={`text-xs font-dm ${form.body.length > MAX_BODY - 20 ? 'text-amber-400' : 'text-[var(--muted)]'}`}
                >
                  {form.body.length}/{MAX_BODY}
                </span>
              </div>
              <textarea
                id="notif-body"
                required
                maxLength={MAX_BODY}
                rows={4}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Escribe el mensaje que veras el operario..."
                aria-describedby="body-hint"
                className={TEXTAREA_CLASS}
              />
              <p id="body-hint" className="text-[10px] text-[var(--muted)] mt-1 font-dm">
                Maximo {MAX_BODY} caracteres
              </p>
            </div>

            {/* Destinatarios */}
            <div>
              <fieldset>
                <legend className={LABEL_CLASS}>
                  Destinatarios *
                </legend>

                <div className="flex flex-col gap-2 mb-4">
                  {(
                    [
                      { value: 'ALL', label: 'Todos los operarios', Icon: Users },
                      { value: 'SITE', label: 'Por obra', Icon: MapPin },
                      { value: 'SPECIFIC', label: 'Usuarios especificos', Icon: User },
                    ] as { value: BulkNotificationTarget; label: string; Icon: React.ElementType }[]
                  ).map(({ value, label, Icon }) => (
                    <label
                      key={value}
                      className={`
                        flex items-center gap-3 p-3 rounded-[var(--radius-btn)] cursor-pointer
                        border transition-all
                        ${form.target === value
                          ? 'border-[rgba(0,212,255,0.4)] bg-[rgba(0,212,255,0.06)]'
                          : 'border-white/[0.08] hover:border-white/20'}
                      `}
                    >
                      <input
                        type="radio"
                        name="target"
                        value={value}
                        checked={form.target === value}
                        onChange={() =>
                          setForm((f) => ({
                            ...f,
                            target: value,
                            work_location_id: '',
                            user_ids: [],
                          }))
                        }
                        className="sr-only"
                      />
                      <Icon
                        className={`w-4 h-4 shrink-0 ${form.target === value ? 'text-[var(--signal)]' : 'text-[var(--muted)]'}`}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-sm font-dm ${form.target === value ? 'text-[var(--off-white)]' : 'text-[var(--muted)]'}`}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Select de obra */}
                {form.target === 'SITE' && (
                  <div>
                    <label htmlFor="notif-location" className={LABEL_CLASS}>
                      Seleccionar obra *
                    </label>
                    <select
                      id="notif-location"
                      required={form.target === 'SITE'}
                      value={form.work_location_id}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, work_location_id: e.target.value }))
                      }
                      className={SELECT_CLASS}
                    >
                      <option value="">Selecciona una obra...</option>
                      {workLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Multiselect de usuarios */}
                {form.target === 'SPECIFIC' && (
                  <div>
                    <label className={LABEL_CLASS}>
                      Seleccionar usuarios *
                    </label>
                    <UserMultiSelect
                      users={users}
                      selectedIds={form.user_ids}
                      onChange={(ids) => setForm((f) => ({ ...f, user_ids: ids }))}
                    />
                  </div>
                )}
              </fieldset>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                disabled={!isFormValid() || sendMutation.isPending}
                aria-label="Enviar notificación"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                Enviar notificacion
              </Button>
            </div>
          </form>
        </section>

        {/* Columna derecha: preview */}
        <section aria-labelledby="preview-section-title" className="flex flex-col gap-4">
          <h2
            id="preview-section-title"
            className="text-base font-semibold text-[var(--off-white)] font-syne"
          >
            Vista previa
          </h2>
          <NotificationPreview title={form.title} body={form.body} />
        </section>
      </div>

      {/* Historial */}
      <section aria-labelledby="history-section-title">
        <h2
          id="history-section-title"
          className="text-base font-semibold text-[var(--off-white)] font-syne mb-4"
        >
          Historial de notificaciones enviadas
        </h2>
        <SentTable
          notifications={sentNotifications}
          isLoading={sentQuery.isLoading}
          isError={sentQuery.isError}
          hasNextPage={!!sentQuery.hasNextPage}
          isFetchingNextPage={sentQuery.isFetchingNextPage}
          onLoadMore={() => sentQuery.fetchNextPage()}
        />
      </section>

      {/* Modal de confirmacion */}
      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar envio"
        description="Revisa el resumen antes de enviar. Esta accion no se puede deshacer."
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {/* Resumen */}
          <div className="rounded-[var(--radius-glass-md)] border border-white/[0.08] divide-y divide-white/[0.04] text-sm font-dm overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="text-[var(--muted)] whitespace-nowrap shrink-0">Titulo</span>
              <span className="text-[var(--off-white)] font-medium flex-1 text-right">
                {form.title}
              </span>
            </div>
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="text-[var(--muted)] whitespace-nowrap shrink-0">Mensaje</span>
              <span className="text-[var(--off-white)]/80 flex-1 text-right line-clamp-3">
                {form.body}
              </span>
            </div>
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="text-[var(--muted)] whitespace-nowrap shrink-0">Destinatarios</span>
              <span className="text-[var(--off-white)]/80 flex-1 text-right">
                {summary}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={sendMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmSend}
              loading={sendMutation.isPending}
            >
              <Megaphone className="w-4 h-4" aria-hidden="true" />
              Confirmar envio
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
