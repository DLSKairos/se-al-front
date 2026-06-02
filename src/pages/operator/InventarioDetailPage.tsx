import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Package,
  Calendar,
  Building2,
  Truck,
  FileText,
  PenLine,
  Edit3,
} from 'lucide-react'
import { inventariosApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { InventarioSession } from '@/types'
import { LoadingSpinner, ErrorMessage } from '@/components/ui'

// ── Helpers ───────────────────────────────────────────────────────────────────

type EstadoSesion = InventarioSession['estado']

const ESTADO_LABELS: Record<EstadoSesion, string> = {
  borrador:   'Borrador',
  completado: 'Completado',
  firmado:    'Firmado',
  cerrado:    'Cerrado',
}

const ESTADO_CLASES: Record<EstadoSesion, string> = {
  borrador:   'bg-[rgba(245,166,35,0.15)] text-amber-400 border border-[rgba(245,166,35,0.3)]',
  completado: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  firmado:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  cerrado:    'bg-white/5 text-white/40 border border-white/10',
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function BadgeEstado({ estado }: { estado: EstadoSesion }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-[var(--radius-badge)] text-[10px] font-semibold font-['DM_Sans'] uppercase tracking-wide ${ESTADO_CLASES[estado]}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  )
}

interface CampoLecturaProps {
  label: string
  valor: string | number | null | undefined
  colSpan?: boolean
}

function CampoLectura({ label, valor, colSpan }: CampoLecturaProps) {
  return (
    <div className={colSpan ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans'] mb-0.5">
        {label}
      </p>
      <p className="text-sm text-[var(--off-white)] font-['DM_Sans'] break-words">
        {valor != null && valor !== '' ? String(valor) : '—'}
      </p>
    </div>
  )
}

function SeccionLectura({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-['DM_Sans'] pb-1 border-b border-white/5">
        {titulo}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function InventarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    data: sesion,
    isLoading,
    error,
  } = useQuery({
    queryKey: QK.inventarios.sesion(id!),
    queryFn: () => inventariosApi.obtenerSesion(id!).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--navy)]">
        <LoadingSpinner size="md" label="Cargando acta..." />
      </div>
    )
  }

  if (error || !sesion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--navy)] gap-4 px-6">
        <ErrorMessage message="No se pudo cargar el acta de inventario." />
        <button
          type="button"
          onClick={() => navigate('/inventarios')}
          className="text-sm text-[var(--signal)] font-['DM_Sans'] hover:underline"
        >
          Volver a Inventarios
        </button>
      </div>
    )
  }

  const esBorrador = sesion.estado === 'borrador'
  const totalItems = sesion._count?.items ?? sesion.items?.length ?? 0
  const totalFotos = sesion._count?.fotos ?? sesion.fotos?.length ?? 0

  const fechaCreacion = new Date(sesion.created_at).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-x-hidden bg-[var(--navy)] pb-24"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3 border-b border-white/5">
        <button
          type="button"
          onClick={() => navigate('/inventarios')}
          aria-label="Volver a inventarios"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--navy-light)] border border-white/10 text-white/60 hover:text-[var(--off-white)] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-['Syne'] font-bold text-base text-[var(--off-white)] truncate">
            {sesion.tipo_formulario}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <BadgeEstado estado={sesion.estado} />
            <span className="text-[10px] text-white/30 font-['DM_Sans']">{fechaCreacion}</span>
          </div>
        </div>
        {esBorrador && (
          <button
            type="button"
            onClick={() => navigate('/inventarios/nueva')}
            aria-label="Continuar editando"
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-btn)] bg-[var(--signal-dim)] border border-[var(--signal)]/30 text-[var(--signal)] text-xs font-['Syne'] font-semibold hover:border-[var(--signal)]/60 transition-colors shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
            Continuar
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 px-4 py-6">
        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-[14px] p-3 flex flex-col items-center gap-1">
            <Package className="w-5 h-5 text-[var(--signal)]" aria-hidden="true" />
            <p className="text-lg font-['Syne'] font-bold text-[var(--off-white)]">{totalItems}</p>
            <p className="text-[10px] text-white/40 font-['DM_Sans']">Ítems</p>
          </div>
          <div className="glass rounded-[14px] p-3 flex flex-col items-center gap-1">
            <Calendar className="w-5 h-5 text-[var(--signal)]" aria-hidden="true" />
            <p className="text-lg font-['Syne'] font-bold text-[var(--off-white)]">{totalFotos}</p>
            <p className="text-[10px] text-white/40 font-['DM_Sans']">Fotos</p>
          </div>
          <div className="glass rounded-[14px] p-3 flex flex-col items-center gap-1">
            <FileText className="w-5 h-5 text-[var(--signal)]" aria-hidden="true" />
            <p className="text-xs font-['Syne'] font-bold text-[var(--off-white)] text-center leading-tight mt-1">
              {sesion.manifiesto || '—'}
            </p>
            <p className="text-[10px] text-white/40 font-['DM_Sans']">Manifiesto</p>
          </div>
        </div>

        {/* Agencia */}
        <SeccionLectura titulo="Agencia de Aduanas">
          <CampoLectura label="Agencia" valor={sesion.agencia_aduanas} colSpan />
          <CampoLectura label="Código" valor={sesion.codigo_agencia} />
          <CampoLectura label="Representante Legal" valor={sesion.representante_legal} />
          <CampoLectura label="Mandato" valor={sesion.mandato} />
        </SeccionLectura>

        {/* Depósito */}
        <SeccionLectura titulo="Depósito">
          <CampoLectura label="Depósito" valor={sesion.deposito} />
          <CampoLectura label="Dirección" valor={sesion.direccion_deposito} colSpan />
        </SeccionLectura>

        {/* Transporte */}
        <SeccionLectura titulo="Transporte">
          <CampoLectura label="Doc. de Transporte" valor={sesion.documento_transporte} />
          <CampoLectura label="Manifiesto" valor={sesion.manifiesto} />
          <CampoLectura label="Fecha Manifiesto" valor={sesion.fecha_manifiesto} />
          <CampoLectura label="Transportadora" valor={sesion.transportadora} />
          <CampoLectura label="Consignatario" valor={sesion.consignatario} colSpan />
        </SeccionLectura>

        {/* Mercancía */}
        <SeccionLectura titulo="Mercancía">
          <CampoLectura label="No. Bultos" valor={sesion.no_bultos} />
          <CampoLectura label="Peso (kg)" valor={sesion.peso} />
          <CampoLectura label="Precintos Retira" valor={sesion.precintos_retira} />
          <CampoLectura label="Precintos Coloca" valor={sesion.precintos_coloca} />
        </SeccionLectura>

        {/* Ítems */}
        {sesion.items && sesion.items.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-white/40" aria-hidden="true" />
              <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-['DM_Sans']">
                Ítems ({sesion.items.length})
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {sesion.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="glass rounded-[14px] p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-full text-[var(--navy)] text-xs font-['Syne'] font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #00D4FF, #0096b3)' }}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm font-['Syne'] text-[var(--off-white)] truncate">
                      {item.descripcion || `Ítem ${idx + 1}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pl-8">
                    <div>
                      <p className="text-[10px] text-white/30 font-['DM_Sans']">Parte No.</p>
                      <p className="text-xs text-[var(--off-white)] font-['DM_Sans']">{item.parte_no || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 font-['DM_Sans']">Cant.</p>
                      <p className="text-xs text-[var(--off-white)] font-['DM_Sans']">{item.cantidad ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 font-['DM_Sans']">País</p>
                      <p className="text-xs text-[var(--off-white)] font-['DM_Sans']">{item.pais || '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fotos */}
        {sesion.fotos && sesion.fotos.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-white/40" aria-hidden="true" />
              <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-['DM_Sans']">
                Fotos ({sesion.fotos.length})
              </h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {sesion.fotos.map((foto) => (
                <div
                  key={foto.id}
                  className="relative aspect-square rounded-[var(--radius-btn)] overflow-hidden bg-[var(--navy-light)] border border-white/10"
                >
                  <img
                    src={foto.url}
                    alt="Foto del acta"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {sesion.observaciones && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-['DM_Sans']">
              Observaciones
            </h3>
            <p className="text-sm text-[var(--off-white)] font-['DM_Sans'] whitespace-pre-wrap glass rounded-[14px] p-4">
              {sesion.observaciones}
            </p>
          </div>
        )}

        {/* Firmas */}
        {(sesion.firmado_deposito_nombre || sesion.firmado_agencia_nombre) && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-white/40" aria-hidden="true" />
              <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-['DM_Sans']">
                Firmas
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sesion.firmado_deposito_nombre && (
                <div className="glass rounded-[14px] p-4 flex flex-col gap-2">
                  <p className="text-[10px] uppercase text-white/30 font-['DM_Sans']">Depósito</p>
                  <p className="text-sm font-['Syne'] text-[var(--off-white)]">
                    {sesion.firmado_deposito_nombre}
                  </p>
                  {sesion.firmado_deposito_url && (
                    <div className="rounded-[var(--radius-input)] overflow-hidden border border-emerald-500/30 bg-white">
                      <img
                        src={sesion.firmado_deposito_url}
                        alt="Firma del depósito"
                        className="w-full h-16 object-contain p-1"
                      />
                    </div>
                  )}
                </div>
              )}
              {sesion.firmado_agencia_nombre && (
                <div className="glass rounded-[14px] p-4 flex flex-col gap-2">
                  <p className="text-[10px] uppercase text-white/30 font-['DM_Sans']">Agencia</p>
                  <p className="text-sm font-['Syne'] text-[var(--off-white)]">
                    {sesion.firmado_agencia_nombre}
                  </p>
                  {sesion.firmado_agencia_url && (
                    <div className="rounded-[var(--radius-input)] overflow-hidden border border-emerald-500/30 bg-white">
                      <img
                        src={sesion.firmado_agencia_url}
                        alt="Firma de la agencia"
                        className="w-full h-16 object-contain p-1"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
