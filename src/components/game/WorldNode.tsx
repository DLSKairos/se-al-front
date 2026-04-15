/**
 * WorldNode — nodo individual del mapa de mundos
 *
 * Props:
 *   world         object   — template de la API (id, name, icon, order?)
 *   status        string   — 'complete' | 'current' | 'locked'
 *   isHighlighted boolean  — activa animación de bounce (tutorial)
 *   onClick       fn       — llamado con world.id (solo si no está locked)
 */
import { Check, Lock } from 'lucide-react'

interface WorldNodeProps {
  world: {
    id:     string
    name:   string
    icon?:  string | null
    order?: number
    shared?: boolean
  }
  status?:        'complete' | 'current' | 'locked'
  isHighlighted?: boolean
  onClick?:       (id: string) => void
}

export default function WorldNode({
  world,
  status = 'locked',
  isHighlighted = false,
  onClick,
}: WorldNodeProps) {
  const clickable = status !== 'locked'
  const shortName = world.name.replace(/^Misión:\s*/i, '')

  const circleCls = status === 'complete'
    ? 'bg-[rgba(34,197,94,0.15)] border-green-500 shadow-[0_0_16px_rgba(34,197,94,0.2)]'
    : status === 'current'
    ? 'bg-[rgba(0,212,255,0.1)] border-[var(--signal)] shadow-[0_0_20px_rgba(0,212,255,0.35)]'
    : 'bg-[rgba(255,255,255,0.05)] border-white/10'

  const statusLabel = status === 'complete'
    ? 'Listo'
    : status === 'current'
    ? 'Pendiente'
    : 'Bloqueado'

  return (
    <button
      className={[
        'relative flex flex-col items-center gap-2 group',
        clickable
          ? 'cursor-pointer hover:scale-105 active:scale-95'
          : 'cursor-not-allowed opacity-50',
      ].join(' ')}
      onClick={clickable ? () => onClick?.(world.id) : undefined}
      disabled={!clickable}
      aria-label={`${shortName} — ${statusLabel}`}
      aria-disabled={!clickable}
    >
      {/* Badge de orden */}
      {world.order != null && (
        <span
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[var(--navy-mid)] border border-white/20 text-[10px] font-bold text-[var(--muted)] flex items-center justify-center font-display z-10"
          aria-hidden="true"
        >
          {world.order}
        </span>
      )}

      {/* Badge shared */}
      {world.shared && (
        <span
          className="absolute -top-2 -right-2 text-xs z-10"
          title="Misión compartida"
          aria-label="Compartida"
        >
          🤝
        </span>
      )}

      {/* Círculo principal */}
      <div
        className={[
          'w-16 h-16 rounded-full grid place-items-center border-2 transition-all duration-200',
          circleCls,
          isHighlighted ? 'animate-bounce' : '',
        ].join(' ')}
      >
        {status === 'complete'
          ? <Check className="w-6 h-6 text-green-400" />
          : status === 'locked'
          ? <Lock className="w-5 h-5 text-[var(--muted)]" />
          : <span className="text-2xl leading-none" aria-hidden="true">{world.icon ?? '📋'}</span>
        }
      </div>

      {/* Nombre debajo del círculo */}
      <span className="text-xs text-[var(--off-white)] text-center w-20 line-clamp-2 leading-tight font-dm">
        {shortName}
      </span>
    </button>
  )
}
