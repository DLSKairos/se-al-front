import { useState, FormEvent, useId } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronDown,
  Link2,
  RefreshCw,
  Send,
  Settings,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react'
import { superadminApi, featureFlagsApi, magicLinkApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { OrgWithUsage, OrgConfig, PlanTier, AdminUser, FeatureFlags, MagicLinkHistoryItem } from '@/types'
import { Button, LoadingSpinner, ErrorMessage, Badge, useToast } from '@/components/ui'
import { UsageBar } from '@/components/super/UsageBar'

// ── Constantes ────────────────────────────────────────────────────────────────

const PLAN_OPTIONS: { value: PlanTier; label: string }[] = [
  { value: 'STARTER',      label: 'Starter'      },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'ENTERPRISE',   label: 'Enterprise'   },
]

const FEATURE_FLAG_LABELS: Record<keyof FeatureFlags, string> = {
  oauth_google:          'OAuth Google',
  oauth_microsoft:       'OAuth Microsoft',
  electronic_signature:  'Firma electrónica',
  magic_link:            'Magic link',
  superadmin_panel:      'Panel super admin',
}

const INPUT_CLASS =
  'w-full bg-white/5 border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] placeholder-[var(--muted)] font-["DM_Sans"] outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all disabled:opacity-50 aria-[invalid=true]:border-red-500/50'

const SELECT_CLASS =
  'w-full bg-white/5 border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-["DM_Sans"] outline-none focus:border-[var(--signal)] transition-all disabled:opacity-50'

// ── Sección Plan y límites ────────────────────────────────────────────────────

interface PlanFormState {
  display_name: string
  plan: PlanTier
  max_users: string
  max_sites: string
  primary_color: string
  logo_url: string
}

function PlanSection({
  orgId,
  config,
  usage,
}: {
  orgId: string
  config: OrgConfig | null
  usage: OrgWithUsage['usage']
}) {
  const toast        = useToast()
  const queryClient  = useQueryClient()

  const [form, setForm] = useState<PlanFormState>({
    display_name:  config?.display_name ?? '',
    plan:          config?.plan ?? 'STARTER',
    max_users:     String(config?.max_users ?? usage.max_users),
    max_sites:     String(config?.max_sites ?? usage.max_sites),
    primary_color: config?.primary_color ?? '',
    logo_url:      config?.logo_url ?? '',
  })

  const setField = (key: keyof PlanFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const configMutation = useMutation({
    mutationFn: () =>
      superadminApi.updateConfig(orgId, {
        display_name:  form.display_name || undefined,
        plan:          form.plan,
        max_users:     Number(form.max_users) || undefined,
        max_sites:     Number(form.max_sites) || undefined,
        primary_color: form.primary_color || undefined,
        logo_url:      form.logo_url || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.superadmin.org(orgId) })
      queryClient.invalidateQueries({ queryKey: QK.superadmin.orgs() })
      queryClient.invalidateQueries({ queryKey: QK.superadmin.usage(orgId) })
      toast.success('Configuración actualizada correctamente')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error al actualizar la configuración'
      toast.error(message)
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    configMutation.mutate()
  }

  return (
    <SectionCard
      icon={Settings}
      title="Plan y límites"
      description="Configura el plan, personalización y límites de la organización."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">Nombre visible (display name)</label>
            <input
              type="text"
              value={form.display_name}
              onChange={setField('display_name')}
              placeholder={config?.display_name ?? 'Nombre visible'}
              maxLength={120}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">Plan</label>
            <div className="relative">
              <select
                value={form.plan}
                onChange={setField('plan')}
                className={`${SELECT_CLASS} appearance-none pr-8`}
              >
                {PLAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">Máx. usuarios</label>
            <input
              type="number"
              min={1}
              value={form.max_users}
              onChange={setField('max_users')}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">Máx. sedes</label>
            <input
              type="number"
              min={1}
              value={form.max_sites}
              onChange={setField('max_sites')}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">Color primario (hex)</label>
            <input
              type="text"
              value={form.primary_color}
              onChange={setField('primary_color')}
              placeholder="#00D4FF"
              maxLength={20}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">URL de logo</label>
            <input
              type="url"
              value={form.logo_url}
              onChange={setField('logo_url')}
              placeholder="https://..."
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Uso en vivo */}
        <div className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
          <p className="text-xs text-[var(--muted)] font-['DM_Sans'] uppercase tracking-wider">
            Uso actual
          </p>
          <UsageBar
            current={usage.current_users}
            max={Number(form.max_users) || usage.max_users}
            label="Usuarios"
          />
          <UsageBar
            current={usage.current_sites}
            max={Number(form.max_sites) || usage.max_sites}
            label="Sedes"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-white/5">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={configMutation.isPending}
            disabled={configMutation.isPending}
          >
            {configMutation.isPending ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

// ── Sección Magic Link de primer acceso ──────────────────────────────────────

function MagicLinkSection({ orgId }: { orgId: string }) {
  const toast       = useToast()
  const [selectedAdminId, setSelectedAdminId] = useState('')
  const adminSelectId = useId()

  const { data: admins = [], isLoading: loadingAdmins } = useQuery({
    queryKey: [...QK.administrators(), orgId],
    queryFn:  () => superadminApi.listAdministrators(orgId).then((r) => r.data),
  })

  const orgAdmins: AdminUser[] = admins

  const generateMutation = useMutation({
    mutationFn: () => superadminApi.generateFirstAdminLink(orgId, selectedAdminId),
    onSuccess: () => {
      toast.success('Magic link generado y enviado correctamente')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error al generar el magic link'
      toast.error(message)
    },
  })

  const selectedAdmin = orgAdmins.find((a) => a.id === selectedAdminId)
  const noEmail       = selectedAdmin && !selectedAdmin.email

  return (
    <SectionCard
      icon={Send}
      title="Primer acceso del administrador"
      description="Genera y envía un magic link de activación al administrador principal de esta organización."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={adminSelectId} className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">
            Administrador destinatario
          </label>
          {loadingAdmins ? (
            <div className="h-11 rounded-[var(--radius-input)] bg-white/5 animate-pulse" />
          ) : orgAdmins.length === 0 ? (
            <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
              Esta organización no tiene administradores registrados.
            </p>
          ) : (
            <div className="relative">
              <select
                id={adminSelectId}
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                className={`${SELECT_CLASS} appearance-none pr-8`}
                disabled={generateMutation.isPending}
              >
                <option value="">Seleccionar administrador...</option>
                {orgAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                    {admin.email ? ` — ${admin.email}` : ' — sin email'}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            </div>
          )}
        </div>

        {/* Advertencia si el usuario no tiene email */}
        {noEmail && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-['DM_Sans']">
            <span className="shrink-0">⚠</span>
            <span>
              Este administrador no tiene email registrado. El magic link no podrá ser enviado por correo.
            </span>
          </div>
        )}

        <Button
          variant="primary"
          size="md"
          disabled={!selectedAdminId || generateMutation.isPending}
          loading={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          <Link2 className="w-4 h-4" />
          {generateMutation.isPending ? 'Generando...' : 'Generar y enviar magic link'}
        </Button>
      </div>
    </SectionCard>
  )
}

// ── Sección Historial de magic links ─────────────────────────────────────────

function MagicLinkHistory({ orgId }: { orgId: string }) {
  const toast       = useToast()
  const queryClient = useQueryClient()

  const { data: history = [], isLoading } = useQuery({
    queryKey: QK.superadmin.mlHistory(orgId),
    queryFn:  () => superadminApi.getMagicLinkHistory(orgId).then((r) => r.data),
  })

  const resendMutation = useMutation({
    mutationFn: (tokenId: string) => magicLinkApi.resend(tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.superadmin.mlHistory(orgId) })
      toast.success('Magic link reenviado correctamente')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error al reenviar el magic link'
      toast.error(message)
    },
  })

  return (
    <SectionCard
      icon={RefreshCw}
      title="Historial de magic links"
      description="Registro de todos los magic links generados para esta organización."
    >
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner label="Cargando historial..." />
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-[var(--muted)] font-['DM_Sans'] text-center py-4">
          No se han generado magic links para esta organización.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['DM_Sans']">
            <thead>
              <tr className="border-b border-white/5">
                {['Destinatario', 'Propósito', 'Estado', 'Creado', 'Reenviar'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2 pr-4 text-xs text-[var(--muted)] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((item: MagicLinkHistoryItem) => {
                const isUsed    = !!item.used_at
                const isExpired = !isUsed && new Date(item.expires_at) < new Date()
                const statusLabel = isUsed ? 'Usado' : isExpired ? 'Expirado' : 'Activo'
                const statusVariant =
                  isUsed ? 'success' : isExpired ? 'danger' : 'info'

                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 text-[var(--off-white)]">
                      {item.user?.name ?? '—'}
                      {item.user?.email && (
                        <span className="block text-xs text-[var(--muted)]">
                          {item.user.email}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-[var(--muted)]">
                      {item.purpose === 'FIRST_ACCESS_ADMIN' ? 'Primer acceso' : 'Invitación'}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-[var(--muted)] whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="py-3">
                      {!isUsed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendMutation.mutate(item.id)}
                          disabled={resendMutation.isPending}
                          aria-label="Reenviar magic link"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reenviar
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}

// ── Sección Feature flags ─────────────────────────────────────────────────────

const KNOWN_FLAGS = [
  'oauth_google',
  'oauth_microsoft',
  'electronic_signature',
  'magic_link',
  'superadmin_panel',
] as const

function FeatureFlagsSection() {
  const toast       = useToast()
  const queryClient = useQueryClient()

  const { data: flags, isLoading } = useQuery({
    queryKey: QK.featureFlags(),
    queryFn:  () => featureFlagsApi.getAll().then((r) => r.data),
  })

  const setFlagMutation = useMutation({
    mutationFn: ({ flag, enabled }: { flag: string; enabled: boolean }) =>
      featureFlagsApi.setFlag(flag, enabled),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: QK.featureFlags() })
      queryClient.invalidateQueries({ queryKey: QK.superadmin.featureFlags() })
      toast.success(
        `Flag "${vars.flag}" ${vars.enabled ? 'activado' : 'desactivado'}`,
      )
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error al cambiar el feature flag'
      toast.error(message)
    },
  })

  return (
    <SectionCard
      icon={ToggleRight}
      title="Feature flags"
      description="Activa o desactiva funcionalidades del sistema sin redespliegue."
    >
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner label="Cargando flags..." />
        </div>
      ) : !flags ? (
        <p className="text-sm text-[var(--muted)] font-['DM_Sans'] text-center py-4">
          No se pudieron cargar los feature flags.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-white/5">
          {KNOWN_FLAGS.map((flag) => {
            const enabled  = !!flags[flag]
            const isPending = setFlagMutation.isPending && setFlagMutation.variables?.flag === flag

            return (
              <div key={flag} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm text-[var(--off-white)] font-['DM_Sans']">
                    {FEATURE_FLAG_LABELS[flag] ?? flag}
                  </p>
                  <p className="text-xs text-[var(--muted)] font-mono">{flag}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${FEATURE_FLAG_LABELS[flag] ?? flag}: ${enabled ? 'activado' : 'desactivado'}`}
                  disabled={isPending}
                  onClick={() => setFlagMutation.mutate({ flag, enabled: !enabled })}
                  className={`shrink-0 transition-colors disabled:opacity-50 ${
                    enabled ? 'text-[var(--signal)]' : 'text-[var(--muted)]'
                  }`}
                >
                  {enabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

// ── SectionCard — Wrapper reutilizable ────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--signal)]/10 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-[var(--signal)]" />
        </div>
        <div>
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-white/5" />
      {children}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function OrgDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()

  const { data: org, isLoading, error, refetch } = useQuery({
    queryKey: QK.superadmin.org(id ?? ''),
    queryFn:  () => superadminApi.getOrganization(id!).then((r) => r.data),
    enabled:  !!id,
  })

  if (isLoading) {
    return <LoadingSpinner label="Cargando organización..." />
  }

  if (error || !org) {
    return (
      <ErrorMessage
        title="Organización no encontrada"
        message="No se pudo cargar la información de esta organización."
        onRetry={() => refetch()}
      />
    )
  }

  const formattedDate = new Date(org.created_at).toLocaleDateString('es-CO', {
    year:   'numeric',
    month:  'long',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/super')}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-white/5 transition-colors"
          aria-label="Volver a organizaciones"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-['Syne'] font-bold text-2xl text-[var(--off-white)] truncate">
            {org.config?.display_name ?? org.name}
          </h1>
          <p className="text-sm text-[var(--muted)] font-['DM_Sans'] mt-0.5">
            Detalle de organización
          </p>
        </div>
      </div>

      {/* Resumen de info */}
      <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--signal)]/10 flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6 text-[var(--signal)]" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="font-['Syne'] font-semibold text-lg text-[var(--off-white)] truncate">
            {org.config?.display_name ?? org.name}
          </p>
          {org.name !== (org.config?.display_name ?? org.name) && (
            <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
              Nombre técnico: {org.name}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-xs text-[var(--muted)] font-['DM_Sans'] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              Registrada el {formattedDate}
            </span>
            <span className="text-xs text-[var(--muted)] font-['DM_Sans'] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 shrink-0" />
              {org.usage.current_users} / {org.usage.max_users} usuarios
            </span>
          </div>
        </div>
      </div>

      {/* Sección 1: Plan y límites */}
      <PlanSection orgId={org.id} config={org.config} usage={org.usage} />

      {/* Sección 2: Primer acceso del admin */}
      <MagicLinkSection orgId={org.id} />

      {/* Sección 3: Historial de magic links */}
      <MagicLinkHistory orgId={org.id} />

      {/* Sección 4: Feature flags */}
      <FeatureFlagsSection />
    </div>
  )
}
