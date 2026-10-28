import { InventarioSession } from '@/types'

// ── Estado de sesión de inventario ───────────────────────────────────────────

export type EstadoSesion = InventarioSession['estado']

export const ESTADO_LABELS: Record<EstadoSesion, string> = {
  borrador:   'Borrador',
  completado: 'Completado',
  firmado:    'Firmado',
  cerrado:    'Cerrado',
}

export const ESTADO_CLASES: Record<EstadoSesion, string> = {
  borrador:   'bg-[rgba(245,166,35,0.15)] text-amber-400 border border-[rgba(245,166,35,0.3)]',
  completado: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  firmado:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  cerrado:    'bg-white/5 text-[var(--fg-muted)] border border-white/10',
}

interface BadgeEstadoProps {
  estado: EstadoSesion
  className?: string
}

export function BadgeEstado({ estado, className = 'px-2 py-0.5' }: BadgeEstadoProps) {
  return (
    <span
      className={`inline-flex items-center ${className} rounded-[var(--radius-badge)] text-[12px] font-semibold font-body uppercase tracking-wide ${ESTADO_CLASES[estado]}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  )
}
