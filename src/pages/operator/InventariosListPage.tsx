import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, ClipboardCheck, ChevronRight, Package } from 'lucide-react'
import { inventariosApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { InventarioSession } from '@/types'
import { LoadingSpinner, ErrorMessage } from '@/components/ui'
import { BadgeEstado } from '@/components/inventarios/BadgeEstado'
import { usePageTitle } from '@/hooks/usePageTitle'

// ── Helpers ───────────────────────────────────────────────────────────────────

function SesionCard({ sesion }: { sesion: InventarioSession }) {
  const navigate = useNavigate()
  const fecha = new Date(sesion.created_at).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const totalItems = sesion._count?.items ?? sesion.items?.length ?? 0

  return (
    <button
      type="button"
      onClick={() => navigate(`/inventarios/${sesion.id}`)}
      className="w-full flex items-center gap-4 p-5 glass rounded-[20px] hover:border-[color:var(--line-strong)] transition-all text-left active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-[14px] bg-[var(--wash)] flex items-center justify-center shrink-0 border border-[color:var(--line)]">
        <Package className="w-6 h-6 text-[var(--accent-ink)]" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-display font-semibold text-[var(--off-white)] truncate">
            {sesion.tipo_formulario}
          </p>
          <BadgeEstado estado={sesion.estado} />
        </div>
        {sesion.consignatario && (
          <p className="text-xs text-[var(--muted)] font-body truncate mb-0.5">
            {sesion.consignatario}
          </p>
        )}
        <p className="text-[12px] text-[var(--fg-muted)] font-body">
          {fecha}
          {totalItems > 0 ? ` · ${totalItems} ítem${totalItems !== 1 ? 's' : ''}` : ''}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true" />
    </button>
  )
}

function SesionCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 glass rounded-[20px] animate-pulse">
      <div className="w-12 h-12 rounded-[14px] bg-white/5 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 w-40 rounded bg-white/5" />
        <div className="h-3 w-24 rounded bg-white/5" />
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function InventariosListPage() {
  usePageTitle('Inventarios')

  const navigate = useNavigate()

  const {
    data: sesiones = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QK.inventarios.sesiones(),
    queryFn: () => inventariosApi.listarSesiones().then((r) => r.data),
  })

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-x-hidden bg-[var(--navy)] pb-24"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold text-[var(--accent-ink)] mb-1">
            Módulo
          </p>
          <h1 className="font-display font-extrabold text-xl text-[var(--off-white)] leading-tight">
            Inventarios
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/inventarios/nueva')}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-btn)] font-display font-semibold text-[var(--on-brand)] text-sm shrink-0 transition-all active:scale-[0.97] whitespace-nowrap"
          style={{
            background: 'var(--brand)',
            boxShadow: '0 6px 16px -6px color-mix(in srgb,var(--brand) 70%,transparent)',
          }}
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Nueva Acta</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 px-6">
        {isLoading && (
          <>
            <SesionCardSkeleton />
            <SesionCardSkeleton />
            <SesionCardSkeleton />
          </>
        )}

        {!isLoading && error && (
          <ErrorMessage message="No se pudieron cargar los inventarios." />
        )}

        {!isLoading && !error && sesiones.length === 0 && (
          <div className="glass p-10 rounded-[20px] flex flex-col items-center text-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--signal-dim)]">
              <ClipboardCheck className="w-7 h-7 text-[var(--accent-ink)]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display font-semibold text-[var(--off-white)] text-sm mb-1">
                No tienes actas creadas aún
              </p>
              <p className="text-xs text-[var(--fg-muted)] font-body">
                Toca "Nueva Acta" para comenzar un inventario aduanero.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && sesiones.length > 0 && (
          <div className="flex flex-col gap-3" role="list" aria-label="Sesiones de inventario">
            {sesiones.map((sesion) => (
              <div key={sesion.id} role="listitem">
                <SesionCard sesion={sesion} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
